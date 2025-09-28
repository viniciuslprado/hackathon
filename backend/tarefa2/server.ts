import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import Fuse from "fuse.js";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import { PrismaClient } from "@prisma/client";

interface Procedure {
  id: number;
  Código: number;
  PROCEDIMENTO: string;
  auditoria: number; // 0 = sem auditoria, 5 = 5 dias, 10 = 10 dias
}

interface Decision {
  audit_required: boolean;
  authorized: boolean;
  reason: string;
  estimated_days?: number;
}

const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'image/png' || file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(null, false);
    }
  }
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Inicializar Prisma Client
const prisma = new PrismaClient();

// --- Funções auxiliares ---
async function extractTextFromPdf(path: string): Promise<string> {
  const dataBuffer = fs.readFileSync(path);
  const data = await pdfParse(dataBuffer);
  return data.text || "";
}

async function ocrFile(path: string): Promise<string> {
  const worker = await createWorker('por+eng');
  const { data: { text } } = await worker.recognize(path);
  await worker.terminate();
  return text;
}

function normalizeText(s: string): string {
  return s
    ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\w\s]/g, " ")
    : "";
}

async function getProcedures(): Promise<Procedure[]> {
  // Buscando procedimentos da tabela procedimento
  const procedures = await prisma.$queryRaw<Procedure[]>`
    SELECT id, "Código", "PROCEDIMENTO", auditoria
    FROM "procedimento"
  `;
  
  return procedures;
}

function decide(proc: Procedure): Decision {
  if (proc.auditoria === 0) {
    return { audit_required: false, authorized: true, reason: "Autorizado automaticamente." };
  }
  if (proc.auditoria === 5 || proc.auditoria === 10) {
    return {
      audit_required: true,
      authorized: false,
      estimated_days: proc.auditoria,
      reason: `Encaminhado para auditoria (${proc.auditoria} dias úteis).`
    };
  }
  return { audit_required: false, authorized: false, reason: "Procedimento requer análise especial." };
}

app.get("/api/health", async (req: Request, res: Response) => {
  try {
    // Testar conexão com o banco
    const count = await prisma.$queryRaw<[{count: bigint}]>`SELECT COUNT(*) as count FROM "procedimento"`;
    
    return res.json({
      status: "OK",
      message: "Servidor funcionando",
      database: "Conectado",
      procedures_count: Number(count[0].count),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      status: "ERROR",
      message: "Erro no servidor",
      database: "Erro de conexão",
      error: error instanceof Error ? error.message : "Erro desconhecido",
      timestamp: new Date().toISOString()
    });
  }
});

// Middleware para tratar erros do multer
app.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Muitos arquivos. Envie apenas um arquivo.' });
    }
  }
  if (error.message === 'Apenas arquivos PDF, PNG ou JPEG são permitidos') {
    return res.status(400).json({ error: error.message });
  }
  console.error('Erro do multer:', error);
  res.status(500).json({ error: 'Erro ao processar upload.' });
});

// --- Endpoint principal ---
app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo é obrigatório." });

    let text = await extractTextFromPdf(req.file.path);
    if (!text || text.length < 30) {
      text = await ocrFile(req.file.path);
    }

    const normalized = normalizeText(text);
    console.log('Texto extraído:', text.substring(0, 200) + '...');
    console.log('Texto normalizado:', normalized.substring(0, 200) + '...');
    
    const procedures = await getProcedures();
    console.log('Total de procedimentos encontrados:', procedures.length);
    console.log('Primeiros 3 procedimentos:', procedures.slice(0, 3).map(p => ({
      id: p.id,
      codigo: p.Código,
      name: p.PROCEDIMENTO,
      auditoria: p.auditoria
    })));

    const fuse = new Fuse(procedures, {
      keys: ["PROCEDIMENTO"],
      threshold: 0.4,
      includeScore: true,
      minMatchCharLength: 3
    });

    // 1) Filtrar procedimentos com nome válido (não vazios ou "---")
    const validProcedures = procedures.filter(p => 
      p.PROCEDIMENTO && 
      p.PROCEDIMENTO.trim() !== '' && 
      p.PROCEDIMENTO.trim() !== '---' &&
      p.PROCEDIMENTO.length > 2
    );
    
    console.log('Procedimentos válidos:', validProcedures.length);

    // 2) substring search nos procedimentos válidos
    let best: Procedure | null = null;
    
    // Primeiro, tentar buscar por palavras-chave importantes
    const keywords = normalized.split(' ').filter(word => word.length > 3);
    console.log('Palavras-chave extraídas:', keywords.slice(0, 10));
    
    for (const proc of validProcedures) {
      const procNormalized = normalizeText(proc.PROCEDIMENTO);
      
      // Buscar por substring direta
      if (normalized.includes(procNormalized) || procNormalized.includes(normalized)) {
        best = proc;
        console.log('Match encontrado por substring:', proc.PROCEDIMENTO);
        break;
      }
      
      // Buscar por palavras-chave
      const matchedKeywords = keywords.filter(keyword => 
        procNormalized.includes(keyword) || keyword.includes(procNormalized)
      );
      
      if (matchedKeywords.length >= 2) { // Se pelo menos 2 palavras-chave coincidirem
        best = proc;
        console.log('Match encontrado por palavras-chave:', proc.PROCEDIMENTO, 'Keywords:', matchedKeywords);
        break;
      }
    }

    // 3) fuzzy search mais flexível se não encontrou
    if (!best) {
      const fuseValid = new Fuse(validProcedures, {
        keys: ["PROCEDIMENTO"],
        threshold: 0.6, // Mais flexível
        includeScore: true,
        minMatchCharLength: 2,
        distance: 100
      });
      
      // Buscar por palavras-chave individuais se o texto completo não der resultado
      let results = fuseValid.search(normalized);
      
      if (results.length === 0 && keywords.length > 0) {
        // Tentar com palavras-chave individuais
        for (const keyword of keywords.slice(0, 5)) { // Top 5 palavras-chave
          results = fuseValid.search(keyword);
          if (results.length > 0) {
            console.log(`Match encontrado buscando por palavra-chave: "${keyword}"`);
            break;
          }
        }
      }
      
      if (results.length > 0) {
        best = results[0].item;
        console.log('Match encontrado por fuzzy search:', best.PROCEDIMENTO, 'Score:', results[0].score);
      }
    }

  if (!best) {
    console.log('❌ Nenhum procedimento encontrado!');
    console.log('Texto buscado:', normalized.substring(0, 100));
    console.log('Palavras-chave tentadas:', keywords.slice(0, 5));
    return res.json({
      found: false,
      message: "Procedimento não identificado no banco."
    });
  }

  console.log('✅ Procedimento encontrado:', best.PROCEDIMENTO, 'Auditoria:', best.auditoria);

  const decision = decide(best);

  return res.json({
    requestId: uuidv4(),
    found: true,
    matched: {
      id: best.id,
      code: best.Código.toString(),
      name: best.PROCEDIMENTO
    },
    ...decision
  });
  } catch (error) {
    console.error('Erro no endpoint /api/upload:', error);
    res.status(500).json({ 
      error: "Erro interno do servidor",
      message: error instanceof Error ? error.message : "Erro desconhecido"
    });
  } finally {
    // Limpar arquivo temporário se existir
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

app.listen(3060, () => {
  console.log("Servidor rodando na porta 3060");
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit();
});
