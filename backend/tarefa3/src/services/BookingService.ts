import { BookingRepository, SpecialtyData, AvailableSlotData } from '../repositories/BookingRepository';
import { Booking } from '@prisma/client'; // Importamos o tipo base Booking para o resultado final do repositório

// Tipagem para o objeto de confirmação que o Service retorna ao Controller
interface BookingConfirmation {
    message: string;
    protocol: string;
    doctorName: string;
    dateTime: Date;
    patientName: string;
}

export class BookingService {
    private bookingRepository: BookingRepository;

    constructor() {
        this.bookingRepository = new BookingRepository();
    }

    /**
     * Obtém todas as especialidades.
     */
    async getSpecialties(): Promise<SpecialtyData[]> {
        // Agora, o tipo de retorno 'SpecialtyData[]' garante que só existem 'id' e 'name'.
        return this.bookingRepository.getSpecialties();
    }

    /**
     * Obtém médicos por especialidade.
     */
    async getDoctorsBySpecialty(specialtyId: number): Promise<{ id: number; name: string; crm: string }[]> {
        return this.bookingRepository.getDoctorsBySpecialty(specialtyId);
    }

    /**
     * Obtém horários disponíveis e os agrupa por data.
     */
    async getGroupedAvailableSlots(specialtyId: number): Promise<Record<string, AvailableSlotData[]>> {
        // Usa o tipo de retorno correto 'AvailableSlotData[]'
        const slots = await this.bookingRepository.getAvailableSlots(specialtyId);

        if (slots.length === 0) {
            // Lógica de negócio: Se não houver vagas no período (30 dias)
            return {};
        }

        // Agrupa os resultados por Data (YYYY-MM-DD) para o frontend
        return slots.reduce((acc, slot) => {
            // Acesso seguro a 'dateTime' e 'doctor.name', garantido pelos tipos do Repository
            const dateKey = slot.dateTime.toISOString().split('T')[0];
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(slot);
            return acc;
        }, {} as Record<string, AvailableSlotData[]>);
    }

    /**
     * Processa e finaliza o agendamento.
     */
    async processBooking(data: {
        availableHourId: number;
        patientName: string;
        patientBirth: string;
        reasonConsultation: string;
    }): Promise<BookingConfirmation> {
        // Aqui, o 'bookingResult' é do tipo Booking com os 'includes' garantidos pelo Repository
        const bookingResult: Booking | null = await this.bookingRepository.createBooking(data);

        if (!bookingResult) {
            // Lançamos um erro com uma mensagem clara para o Controller tratar o 409 (Conflito)
            throw new Error("Slot indisponível ou dados inválidos.");
        }

        // Para evitar o erro 'Property doctor does not exist...', precisamos
        // garantir a tipagem que inclui o relacionamento.
        // Já que o Repository garante o include, usamos um Type Assertion (Asseguração de Tipo)
        // para tranquilizar o TypeScript de que 'doctor' e 'availableHour' existem.
        const confirmedBooking = bookingResult as Booking & { 
            doctor: { name: string }, // Apenas os dados que precisamos
            availableHour: { dateTime: Date } 
        };

        // Retorna um objeto de confirmação limpo para o Controller
        return {
            message: 'Agendamento confirmado com sucesso!',
            protocol: confirmedBooking.protocol,
            doctorName: confirmedBooking.doctor.name, // Acesso correto ao nome do médico
            dateTime: confirmedBooking.availableHour.dateTime, // Acesso correto à data e hora
            patientName: confirmedBooking.patientName
        };
    }
}