// src/routes/bookingRoutes.ts
import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';

const router = Router();
const bookingController = new BookingController();

// 1. Listar Especialidades
router.get('/specialties', bookingController.getSpecialties.bind(bookingController));

// 2. Listar Agendas Disponíveis (Busca por Especialidade)
router.get('/schedules', bookingController.getAvailableSchedules.bind(bookingController));

// 3. Efetivar Agendamento (POST)
router.post('/book', bookingController.bookAppointment.bind(bookingController));

export default router;