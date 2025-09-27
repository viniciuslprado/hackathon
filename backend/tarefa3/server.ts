import express from "express";
import cors from "cors";

const app = express();
const PORT = 3030;

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Simulação de dados (médicos disponíveis)
const MEDICOS = [
    { id: 1, nome: "Dr. João Silva", especialidade: "Cardiologia" },
    { id: 2, nome: "Dra. Maria Santos", especialidade: "Cardiologia" },
    { id: 3, nome: "Dr. Pedro Costa", especialidade: "Dermatologia" },
    { id: 4, nome: "Dra. Ana Lima", especialidade: "Dermatologia" }
];

// Horários disponíveis (simulados)
const HORARIOS = [
    "2025-09-28 09:00",
    "2025-09-28 10:00", 
    "2025-09-28 14:00",
    "2025-09-28 15:00",
    "2025-09-29 09:00",
    "2025-09-29 11:00"
];

// Armazenamento simples de sessões (em produção usar Redis)
const sessoes: { [key: string]: any } = {};

// Rota principal do chatbot
app.post('/chat', (req, res) => {
    const { message, sessionId } = req.body;
    const userMsg = message?.trim() || "";
    
    // Inicializa sessão se não existir
    if (!sessoes[sessionId]) {
        sessoes[sessionId] = { etapa: 'nome', dados: {} };
    }
    
    const sessao = sessoes[sessionId];
    let resposta = "";
    
    // Comandos de controle
    if (userMsg.toLowerCase() === 'recomeçar' || userMsg.toLowerCase() === 'voltar') {
        delete sessoes[sessionId];
        sessoes[sessionId] = { etapa: 'nome', dados: {} };
        return res.json({ reply: "Vamos recomeçar! Qual é o seu nome?" });
    }
    
    try {
        switch (sessao.etapa) {
            case 'nome':
                if (!userMsg) {
                    resposta = "Por favor, me diga seu nome para começarmos o agendamento.";
                } else {
                    sessao.dados.nome = userMsg;
                    sessao.etapa = 'especialidade';
                    resposta = `Olá, ${userMsg}! Qual especialidade você precisa?\n\n1. Cardiologia\n2. Dermatologia\n\nDigite o número ou o nome da especialidade.`;
                }
                break;
                
            case 'especialidade':
                let especialidade = "";
                if (userMsg === '1' || userMsg.toLowerCase().includes('cardiologia')) {
                    especialidade = 'Cardiologia';
                } else if (userMsg === '2' || userMsg.toLowerCase().includes('dermatologia')) {
                    especialidade = 'Dermatologia';
                } else {
                    resposta = "Por favor, escolha uma opção válida:\n\n1. Cardiologia\n2. Dermatologia";
                    break;
                }
                
                sessao.dados.especialidade = especialidade;
                const medicosEspec = MEDICOS.filter(m => m.especialidade === especialidade);
                sessao.dados.medicos = medicosEspec;
                sessao.etapa = 'medico';
                
                resposta = `Médicos disponíveis em ${especialidade}:\n\n`;
                medicosEspec.forEach((med, index) => {
                    resposta += `${index + 1}. ${med.nome}\n`;
                });
                resposta += "\nDigite o número do médico escolhido.";
                break;
                
            case 'medico':
                const numMedico = parseInt(userMsg) - 1;
                if (isNaN(numMedico) || numMedico < 0 || numMedico >= sessao.dados.medicos.length) {
                    resposta = "Número inválido! Digite o número do médico da lista.";
                } else {
                    sessao.dados.medico = sessao.dados.medicos[numMedico];
                    sessao.etapa = 'horario';
                    
                    resposta = `Você escolheu: ${sessao.dados.medico.nome}\n\nHorários disponíveis:\n\n`;
                    HORARIOS.forEach((hora, index) => {
                        resposta += `${index + 1}. ${hora}\n`;
                    });
                    resposta += "\nDigite o número do horário desejado.";
                }
                break;
                
            case 'horario':
                const numHorario = parseInt(userMsg) - 1;
                if (isNaN(numHorario) || numHorario < 0 || numHorario >= HORARIOS.length) {
                    resposta = "Número inválido! Digite o número do horário da lista.";
                } else {
                    sessao.dados.horario = HORARIOS[numHorario];
                    sessao.etapa = 'confirmacao';
                    
                    resposta = `✅ RESUMO DO AGENDAMENTO:\n\n`;
                    resposta += `👤 Paciente: ${sessao.dados.nome}\n`;
                    resposta += `👨‍⚕️ Médico: ${sessao.dados.medico.nome}\n`;
                    resposta += `🏥 Especialidade: ${sessao.dados.especialidade}\n`;
                    resposta += `🕐 Horário: ${sessao.dados.horario}\n\n`;
                    resposta += `Digite 'confirmar' para finalizar o agendamento.`;
                }
                break;
                
            case 'confirmacao':
                if (userMsg.toLowerCase() === 'confirmar') {
                    const protocolo = 'AG' + Math.random().toString(36).substring(2, 8).toUpperCase();
                    
                    resposta = `🎉 AGENDAMENTO CONFIRMADO!\n\n`;
                    resposta += `📋 Protocolo: ${protocolo}\n`;
                    resposta += `👤 Paciente: ${sessao.dados.nome}\n`;
                    resposta += `👨‍⚕️ Médico: ${sessao.dados.medico.nome}\n`;
                    resposta += `🏥 Especialidade: ${sessao.dados.especialidade}\n`;
                    resposta += `🕐 Horário: ${sessao.dados.horario}\n\n`;
                    resposta += `Obrigado! Digite 'recomeçar' para um novo agendamento.`;
                    
                    // Limpa a sessão após confirmar
                    delete sessoes[sessionId];
                } else {
                    resposta = "Digite 'confirmar' para finalizar o agendamento ou 'recomeçar' para começar novamente.";
                }
                break;
                
            default:
                sessao.etapa = 'nome';
                resposta = "Vamos começar o agendamento! Qual é o seu nome?";
        }
        
        res.json({ reply: resposta });
        
    } catch (error) {
        console.error('Erro no chat:', error);
        res.status(500).json({ reply: "Erro interno. Digite 'recomeçar' para tentar novamente." });
    }
});

// Inicia servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de Agendamento rodando na porta ${PORT}`);
});

export default app;