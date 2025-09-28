import express, { Request, Response } from "express";
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
  auditoria?: number; // 0 = sem auditoria, 5 = 5 dias, 10 = 10 dias
}

interface Decision {
  audit_required: boolean;
  authorized: boolean;
  reason: string;
  estimated_days?: number;
}

const upload = multer({ dest: "uploads/" });
const app = express();
app.use(express.json());

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
  const procedures = await prisma.procedimentoSaude.findMany({
    select: {
      id: true,
      Código: true,
      PROCEDIMENTO: true
    }
  });
  
  // Mapear para incluir lógica de auditoria baseada no código
  return procedures.map(proc => ({
    ...proc,
    auditoria: getAuditoriaByCode(proc.Código)
  }));
}

function getAuditoriaByCode(codigo: number): number {
  // Lógica para determinar auditoria baseada no código
  // Você pode ajustar esta lógica conforme suas regras de negócio
  if (codigo >= 10000000 && codigo < 20000000) return 0; // Autorização automática
  if (codigo >= 20000000 && codigo < 30000000) return 5; // 5 dias de auditoria
  if (codigo >= 30000000) return 10; // 10 dias de auditoria
  return 0; // Default: autorização automática
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
  return { audit_required: false, authorized: false, reason: "Valor inválido no campo auditoria." };
}

// --- Endpoint principal ---
app.post("/api/upload", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: "Arquivo é obrigatório." });

  let text = await extractTextFromPdf(req.file.path);
  if (!text || text.length < 30) {
    text = await ocrFile(req.file.path);
  }

  const normalized = normalizeText(text);
  const procedures = await getProcedures();

  const fuse = new Fuse(procedures, {
    keys: ["PROCEDIMENTO", "Código"],
    threshold: 0.35,
    includeScore: true
  });

  // 1) substring
  let best: Procedure | null =
    procedures.find(p => normalized.includes(normalizeText(p.PROCEDIMENTO))) || null;

  // 2) fuzzy
  if (!best) {
    const result = fuse.search(normalized);
    if (result.length > 0) best = result[0].item;
  }

  if (!best) {
    return res.json({
      found: false,
      message: "Procedimento não identificado no banco."
    });
  }

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
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
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
