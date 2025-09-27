// tarefa3/controllers/chatController.ts

import { Request, Response } from "express";
import * as appointmentService from "../services/appointmentService";
import * as doctorRepo from "../repositories/doctorRepository"; 
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { Doctor } from "@prisma/client";

// Definição e armazenamento temporário da sessão (em memória)
interface SessionData {
    step: number;
    data: {
        patientName?: string;
        specialty?: string;
        doctorId?: number;
        doctors?: Doctor[];
        slot?: string; 
        availableSlots?: string[]; 
        patientBirth?: string; 
        reason?: string;
    };
}
let chatSessions: { [key: string]: SessionData } = {}; 

const STEPS = {
    START: 0, GET_NAME: 1, GET_SPECIALTY: 2, GET_DOCTOR: 3, GET_SLOT: 4, 
    GET_BIRTH: 5, GET_REASON: 6, CONFIRM_BOOKING: 7, END: 99
};

function resetSession(sessionId: string): string {
    chatSessions[sessionId] = { step: STEPS.GET_NAME, data: {} };
    return "Bem-vindo ao agendamento! Qual é o seu **nome completo**?";
}

function formatSlots(slots: string[]): string {
    if (slots.length === 0) return "Nenhum horário disponível nos próximos dias. Digite 'recomeçar'.";
    
    const limitedSlots = slots.slice(0, 10); 
    
    let reply = "Horários disponíveis (digite o **NÚMERO**):\n\n";
    
    limitedSlots.forEach((s, index) => {
        const date = new Date(s); 
        reply += `${index + 1}. ${format(date, "dd/MM 'às' HH:mm", { locale: ptBR })} (Horário de Brasília)\n`;
    });
    
    return reply;
}

export async function handleChat(req: Request, res: Response) {
    const { message, sessionId } = req.body; 
    
    const isResetCommand = message?.toLowerCase() === 'recomeçar' || message?.toLowerCase() === 'voltar' || message?.toLowerCase() === 'cancelar';
    
    if (!chatSessions[sessionId] || isResetCommand) {
        // Limpa a sessão antes de retornar o reset
        if(chatSessions[sessionId]) delete chatSessions[sessionId];
        return res.json({ reply: resetSession(sessionId) });
    }

    const session = chatSessions[sessionId];
    let reply = "";
    const userMessage = message?.trim() || ""; 

    try {
        switch (session.step) {
            case STEPS.GET_NAME:
                if (!userMessage) {
                    return res.json({ reply: "Por favor, informe seu **nome completo** para iniciarmos o agendamento." });
                }
                
                session.data.patientName = userMessage;
                session.step = STEPS.GET_SPECIALTY;
                reply = `Ótimo, ${session.data.patientName}. Qual **especialidade** você precisa? (Ex: Cardiologia, Dermatologia)`;
                break;

            case STEPS.GET_SPECIALTY:
                if (!userMessage) { 
                    reply = "Por favor, digite a especialidade desejada."; 
                    break; 
                }
                
                session.data.specialty = userMessage;
                const doctors = await doctorRepo.findDoctors({ specialty: session.data.specialty });

                if (doctors.length === 0) {
                    reply = `Não encontramos médicos para a especialidade "${session.data.specialty}". Por favor, tente outra especialidade ou digite 'recomeçar'.`;
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
                const doctorIndex = parseInt(userMessage) - 1;
                
                if (!session.data.doctors || session.data.doctors.length === 0) {
                    console.error('Erro: Lista de médicos ausente na sessão.');
                    reply = "❌ Erro interno: a lista de médicos foi perdida. Digite 'recomeçar'.";
                    delete chatSessions[sessionId];
                    break;
                }
                
                if (isNaN(doctorIndex) || doctorIndex < 0 || doctorIndex >= session.data.doctors.length) {
                    const availableDoctors = session.data.doctors.map((d, i) => `${i+1}. ${d.name}`).join('\n');
                    reply = `❌ Número inválido! Digite apenas o NÚMERO (1 a ${session.data.doctors.length}):\n\n${availableDoctors}\n\n🔍 Você digitou: "${userMessage}"`;
                    break;
                }
                
                const selectedDoctor = session.data.doctors[doctorIndex];
                session.data.doctorId = selectedDoctor.id;
                
                const availableSlots = await appointmentService.listAvailableSlots(session.data.doctorId);
                
                if (availableSlots.length === 0) {
                    reply = "Este médico não tem horários disponíveis nos próximos dias. Digite 'recomeçar' para escolher outro médico.";
                    session.step = STEPS.GET_SPECIALTY;
                    break;
                }
                
                session.data.availableSlots = availableSlots;
                session.step = STEPS.GET_SLOT;
                reply = formatSlots(availableSlots);
                break;

            case STEPS.GET_SLOT:
                const slotMessage = userMessage;
                let selectedSlotISO = "";
                const slotIndex = parseInt(slotMessage) - 1;
                
                if (session.data.availableSlots && !isNaN(slotIndex) && slotIndex >= 0 && slotIndex < session.data.availableSlots.length) {
                    selectedSlotISO = session.data.availableSlots[slotIndex];
                } else {
                    const dateTest = new Date(slotMessage);
                    if (isNaN(dateTest.getTime())) {
                        reply = "Formato inválido. Digite o NÚMERO do horário (1, 2, 3...) ou data/hora no formato AAAA-MM-DD HH:MM.";
                        break;
                    }
                    selectedSlotISO = dateTest.toISOString();
                }
                
                if (!session.data.availableSlots || !session.data.availableSlots.includes(selectedSlotISO)) {
                    reply = "Horário indisponível. Selecione um horário da lista acima ou digite 'recomeçar'.";
                    break;
                }
                
                session.data.slot = selectedSlotISO;
                session.step = STEPS.GET_BIRTH;
                reply = "Quase lá! Por favor, me informe a sua **data de nascimento** (AAAA-MM-DD).";
                break;

            case STEPS.GET_BIRTH:
                const birthDate = new Date(userMessage);
                if (isNaN(birthDate.getTime())) {
                    reply = "Data de nascimento inválida. Use o formato AAAA-MM-DD (ex: 1990-05-15).";
                    break;
                }
                
                session.data.patientBirth = userMessage;
                session.step = STEPS.GET_REASON;
                reply = "Qual o **motivo principal** da consulta?";
                break;
                
            case STEPS.GET_REASON:
                if (!userMessage) {
                    reply = "Por favor, informe o motivo da consulta.";
                    break;
                }
                
                session.data.reason = userMessage;
                
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
                
                session.step = STEPS.END;
                
                const doctorName = session.data.doctors?.find(d => d.id === session.data.doctorId)?.name || 'Médico Desconhecido';
                
                const finalReply = `✅ **AGENDAMENTO CONFIRMADO!**\n\n` +
                                   `**Protocolo:** ${booking.protocol}\n` +
                                   `**Médico:** ${doctorName}\n` +
                                   `**Horário:** ${format(new Date(session.data.slot!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}\n\n` +
                                   `Obrigado! Digite 'recomeçar' para um novo agendamento.`;
                                   
                delete chatSessions[sessionId];
                return res.json({ reply: finalReply });

            default:
                reply = resetSession(sessionId); 
                break;
        }

        res.json({ reply });

    } catch (err: any) {
        console.error("Erro no fluxo do chat:", err.message);
        reply = "❌ Houve um erro interno no agendamento. O processo foi cancelado. Digite 'recomeçar' para tentar novamente.";
        delete chatSessions[sessionId];
        res.status(500).json({ reply });
    }
}