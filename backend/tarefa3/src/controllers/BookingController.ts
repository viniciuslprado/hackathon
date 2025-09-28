// src/controllers/BookingController.ts
import { Request, Response } from 'express';
import { BookingService } from '../services/BookingService';

const bookingService = new BookingService();

export class BookingController {

    /**
     * Rota GET /specialties
     */
    async getSpecialties(req: Request, res: Response): Promise<Response> {
        try {
            const specialties = await bookingService.getSpecialties();
            return res.json(specialties);
        } catch (error) {
            console.error('Erro ao buscar especialidades:', error);
            
            let errorMessage = 'Erro interno do servidor ao buscar especialidades.';
            if (error instanceof Error) {
                // Se for um objeto Error, podemos usar sua mensagem ou logar o erro
                errorMessage = error.message; 
            }
            
            return res.status(500).json({ error: errorMessage });
        }
    }
    /**
     * Rota GET /schedules?specialtyId=X
     */
    async getAvailableSchedules(req: Request, res: Response): Promise<Response> {
        const specialtyId = req.query.specialtyId as string;

        if (!specialtyId || isNaN(parseInt(specialtyId))) {
            return res.status(400).json({ error: 'specialtyId inválido ou ausente.' });
        }

        try {
            const groupedSlots = await bookingService.getGroupedAvailableSlots(parseInt(specialtyId));
            
            // Lógica para informar que não há vagas (Requisito da tarefa)
            if (Object.keys(groupedSlots).length === 0) {
                 return res.json({ message: 'Não há vagas disponíveis para a especialidade nos próximos 30 dias.', schedules: {} });
            }

            return res.json({ message: 'Agendas encontradas.', schedules: groupedSlots });

        } catch (error) {
            console.error('Erro ao buscar agendas:', error);
            return res.status(500).json({ error: 'Erro interno do servidor ao buscar agendas.' });
        }
    }

    /**
     * Rota POST /book
     */
    async bookAppointment(req: Request, res: Response): Promise<Response> {
        const { availableHourId, patientName, patientBirth, reasonConsultation } = req.body;

        if (!availableHourId || !patientName || !patientBirth || !reasonConsultation) {
            return res.status(400).json({ error: 'Faltam dados obrigatórios para o agendamento.' });
        }

        try {
            const bookingConfirmation = await bookingService.processBooking({
                availableHourId, patientName, patientBirth, reasonConsultation
            });
            
            return res.status(201).json(bookingConfirmation);

        } catch (error) {
            let errorMessage = 'Erro interno ao finalizar agendamento.';

            if (error instanceof Error) {
                if (error.message.includes("Slot indisponível")) {
                    return res.status(409).json({ error: 'Este horário não está mais disponível. Tente outro.' });
                }
                errorMessage = error.message;
            } 
            
            console.error('Erro ao efetuar agendamento:', error);
            return res.status(500).json({ error: errorMessage });
        }
    }
}