// src/repositories/BookingRepository.ts
import { PrismaClient, Prisma, AvailableHour, Booking } from '@prisma/client';

const prisma = new PrismaClient();

const specialtySelect = {
    id: true, 
    name: true 
} as const; // <--- Usamos 'as const' para fixar o tipo literal do objeto

// 2. Cria o tipo de retorno usando GetPayload
export type SpecialtyData = Prisma.SpecialtyGetPayload<{ select: typeof specialtySelect }>;


// 3. Tipo para o retorno dos Slots (incluindo o Médico)
const availableSlotSelect = {
    id: true,
    dateTime: true,
    doctor: {
        select: { id: true, name: true, crm: true },
    },
} as const;

export type AvailableSlotData = Prisma.AvailableHourGetPayload<{ select: typeof availableSlotSelect }>;


// ----------------------------------------------------
// CLASSE BOOKINGREPOSITORY
// ----------------------------------------------------

export class BookingRepository {
    
    // --- READ OPERATIONS ---

    /**
     * Busca todas as especialidades disponíveis.
     */
    async getSpecialties(): Promise<SpecialtyData[]> {
        return prisma.specialty.findMany({
            select: specialtySelect,
        });
    }

    /**
     * Busca horários disponíveis em um intervalo de 30 dias para uma especialidade.
     */
    async getAvailableSlots(specialtyId: number): Promise<AvailableSlotData[]> {
        const currentDate = new Date();
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(currentDate.getDate() + 30); // Lógica de 30 dias

        return prisma.availableHour.findMany({
            where: {
                isAvailable: true, // Apenas slots não agendados
                doctor: {
                    specialtyId: specialtyId, // Filtra pela especialidade
                },
                dateTime: {
                    gte: currentDate, // A partir de agora
                    lte: thirtyDaysLater, // Até 30 dias
                },
            },
            select: availableSlotSelect, // Usa o select definido acima
            orderBy: {
                dateTime: 'asc',
            },
        });
    }

    // --- WRITE OPERATIONS (Transaction) ---

    /**
     * Cria um novo agendamento e marca o slot como indisponível, usando uma transação.
     * @returns O agendamento criado com dados do médico e do horário, ou null.
     */
    async createBooking(data: {
        availableHourId: number;
        patientName: string;
        patientBirth: string;
        reasonConsultation: string;
    }): Promise<Booking | null> {
        
        // 1. Pré-busca para obter o doctorId e verificar a disponibilidade inicial.
        const slot = await prisma.availableHour.findUnique({
            where: { id: data.availableHourId },
            include: { doctor: true }
        });

        if (!slot || !slot.isAvailable) {
            return null; // Retorna null se não estiver disponível
        }

        // 2. Prepara dados.
        const protocol = `PRT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const patientBirthDate = new Date(data.patientBirth);
        
        // 3. Transação: Garante Atomicidade (ou tudo ou nada).
        const newBooking = await prisma.$transaction(async (tx) => {
            
            // 3.1. Marca o slot como indisponível
            await tx.availableHour.update({
                where: { id: data.availableHourId },
                data: { isAvailable: false },
            });

            // 3.2. Cria o agendamento
            return tx.booking.create({
                data: {
                    protocol: protocol,
                    availableHourId: data.availableHourId,
                    patientName: data.patientName,
                    patientBirth: patientBirthDate,
                    reasonConsultation: data.reasonConsultation,
                    doctorId: slot.doctorId, 
                },
                include: {
                    doctor: true, // Inclui o Doctor para retorno
                    availableHour: true, // Inclui o Slot para retorno
                }
            });
        });

        return newBooking;
    }
}