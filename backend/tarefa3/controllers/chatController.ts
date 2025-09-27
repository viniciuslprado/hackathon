// chatController.ts: Gerencia o fluxo de conversação passo a passo

import { Request, Response } from "express";
import * as appointmentService from "../services/appointmentService";
import * as doctorRepo from "../repositories/doctorRepository"; 
// Biblioteca de data para formatação amigável
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
// Tipos do Prisma para garantir a segurança dos dados
import { Doctor } from "@prisma/client";

// 💡 ATENÇÃO: Armazenamento da Sessão (Simples e Temporário)
// Em produção, a melhor prática é usar uma solução externa como Redis.
interface SessionData {
    step: number;
    data: {
        patientName?: string;
        specialty?: string;
        doctorId?: number;
        doctors?: Doctor[];
        slot?: string; // ISO string
        availableSlots?: string[]; // ISO strings
        patientBirth?: string; // string AAAA-MM-DD
        reason?: string;
    };
}
let chatSessions: { [key: string]: SessionData } = {}; 

// Constantes de Fluxo de Conversa
const STEPS = {
    START: 0,
    GET_NAME: 1,
    GET_SPECIALTY: 2,
    GET_DOCTOR: 3,
    GET_SLOT: 4,
    GET_BIRTH: 5,
    GET_REASON: 6,
    CONFIRM_BOOKING: 7,
    END: 99
};

// --- Funções Auxiliares ---

/**
 * 🛠️ Inicializa ou reseta a sessão do usuário.
 */
function resetSession(sessionId: string): string {
    chatSessions[sessionId] = { step: STEPS.GET_NAME, data: {} };
    return "Bem-vindo ao agendamento! Qual é o seu **nome completo**?";
}

/**
 * 🛠️ Formata slots de horário para o usuário ver (máx. 10).
 */
function formatSlots(slots: string[]): string {
    if (slots.length === 0) return "Nenhum horário disponível nos próximos dias. Digite 'recomeçar'.";
    
    const limitedSlots = slots.slice(0, 10); 
    
    let reply = "Horários disponíveis (digite o **NÚMERO** ou a data/hora exata AAAA-MM-DD HH:MM):\n\n";
    
    limitedSlots.forEach((s, index) => {
        const date = new Date(s); 
        reply += `${index + 1}. ${format(date, "dd/MM 'às' HH:mm", { locale: ptBR })} (Horário aproximado de Brasília)\n`;
    });
    
    return reply;
}

// --- Controller Principal do Chatbot ---

export async function handleChat(req: Request, res: Response) {
    // Usamos 'message' e 'sessionId' para interagir com o frontend (ChatAgendamento.tsx)
    const { message, sessionId } = req.body; 
    
    // --- LÓGICA DE INÍCIO E RESET ---
    const isResetCommand = message?.toLowerCase() === 'recomeçar' || message?.toLowerCase() === 'voltar';

    if (!chatSessions[sessionId] || isResetCommand) {
        // Primeira mensagem (vazia) do frontend ou comando de reset
        return res.json({ reply: resetSession(sessionId) });
    }

    const session = chatSessions[sessionId];
    let reply = "";

    try {
        switch (session.step) {
            case STEPS.GET_NAME:
                session.data.patientName = message.trim();
                session.step = STEPS.GET_SPECIALTY;
                reply = "Ótimo, " + session.data.patientName + ". Qual **especialidade** você precisa? (Ex: Cardiologia, Dermatologia)";
                break;

            case STEPS.GET_SPECIALTY:
                session.data.specialty = message.trim();
                
                // 🚨 BUSCA MÉDICOS PELA ESPECIALIDADE (usando seu repo)
                const doctors = await doctorRepo.findDoctors({ specialty: session.data.specialty });

                if (doctors.length === 0) {
                    reply = `Não encontramos médicos para "${session.data.specialty}". Por favor, tente outra especialidade ou digite 'recomeçar'.`;
                    break;
                }
                
                session.data.doctors = doctors as Doctor[];
                session.step = STEPS.GET_DOCTOR;
                
                reply = `Encontrei ${doctors.length} médicos. Digite o **NÚMERO** do médico que você prefere:\n`;
                doctors.forEach((doc, index) => {
                    reply += `${index + 1}. ${doc.name} (Especialidade: ${doc.specialty})\n`;
                });
                break;

            case STEPS.GET_DOCTOR:
                const doctorIndex = parseInt(message.trim()) - 1;
                
                if (isNaN(doctorIndex) || doctorIndex < 0 || doctorIndex >= (session.data.doctors?.length ?? 0)) {
                    reply = "Número do médico inválido. Por favor, digite o número da lista.";
                    break;
                }
                
                const selectedDoctor = session.data.doctors![doctorIndex];
                session.data.doctorId = selectedDoctor.id;
                
                // 🚨 BUSCA HORÁRIOS DISPONÍVEIS (usando seu serviço)
                const availableSlots = await appointmentService.listAvailableSlots(session.data.doctorId);
                
                session.data.availableSlots = availableSlots;
                session.step = STEPS.GET_SLOT;
                
                reply = formatSlots(availableSlots);
                break;

            case STEPS.GET_SLOT:
                const slotMessage = message.trim();
                let selectedSlotISO = "";
                
                // 1. Tenta encontrar pelo índice (se o usuário digitou '1', '2', etc.)
                const slotIndex = parseInt(slotMessage) - 1;
                if (session.data.availableSlots && !isNaN(slotIndex) && slotIndex >= 0 && slotIndex < session.data.availableSlots.length) {
                    selectedSlotISO = session.data.availableSlots[slotIndex];
                } else {
                    // 2. Tenta validar a string como Data/Hora
                    const dateTest = new Date(slotMessage);
                    if (isNaN(dateTest.getTime())) {
                        reply = "Formato de horário inválido. Por favor, digite o NÚMERO do slot ou a data/hora no formato AAAA-MM-DD HH:MM.";
                        break;
                    }
                    selectedSlotISO = dateTest.toISOString();
                }
                
                // Validação final se o slot existe e ainda está disponível
                if (!session.data.availableSlots || !session.data.availableSlots.includes(selectedSlotISO)) {
                    reply = "Horário indisponível ou já passou. Por favor, selecione um slot válido da lista ou digite 'recomeçar'.";
                    break;
                }
                
                session.data.slot = selectedSlotISO;
                session.step = STEPS.GET_BIRTH;
                reply = "Quase lá! Por favor, me informe a sua **data de nascimento** (AAAA-MM-DD).";
                break;

            case STEPS.GET_BIRTH:
                // Validação simples de formato AAAA-MM-DD
                const birthDate = new Date(message.trim());
                if (isNaN(birthDate.getTime())) {
                    reply = "Data de nascimento inválida. Use o formato AAAA-MM-DD.";
                    break;
                }
                
                session.data.patientBirth = message.trim();
                session.step = STEPS.GET_REASON;
                reply = "Qual o **motivo principal** da consulta?";
                break;
                
            case STEPS.GET_REASON:
                session.data.reason = message.trim();
                
                // 🚨 CHAMA O SERVIÇO PRINCIPAL DE AGENDAMENTO (bookAppointment)
                const booking = await appointmentService.bookAppointment(
                    session.data.doctorId!,
                    session.data.slot!,
                    {
                        patientName: session.data.patientName!,
                        patientBirth: session.data.patientBirth!,
                        specialty: session.data.specialty!,
                        reason: session.data.reason!
                    }
                );
                
                // Sucesso
                session.step = STEPS.END;
                
                const doctorName = session.data.doctors?.find(d => d.id === session.data.doctorId)?.name || 'Médico Desconhecido';
                
                const finalReply = `✅ **AGENDAMENTO CONFIRMADO!**\n\n` +
                                   `**Protocolo:** ${booking.protocol}\n` +
                                   `**Médico:** ${doctorName}\n` +
                                   `**Horário:** ${format(new Date(session.data.slot!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\n` +
                                   `Obrigado! Digite 'recomeçar' para um novo agendamento.`;
                                   
                // Limpa a sessão após o sucesso
                delete chatSessions[sessionId];
                return res.json({ reply: finalReply });

            default:
                reply = resetSession(sessionId); // Recomeça
                break;
        }

        res.json({ reply });

    } catch (err: any) {
        console.error("Erro no fluxo do chat:", err.message);
        reply = "❌ Houve um erro interno no agendamento. Digite 'recomeçar' para tentar novamente.";
        // Limpa a sessão em caso de erro grave
        delete chatSessions[sessionId];
        res.status(500).json({ reply });
    }
}