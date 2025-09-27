import { Request, Response } from "express";
import * as doctorRepo from "../repositories/doctorRepository";
import * as appointmentService from "../services/appointmentService";

export async function getDoctors(req: Request, res: Response) {
  try {
    // Permite a busca por specialty e city
    const doctors = await doctorRepo.findDoctors(req.query as any);
    res.json(doctors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDoctorSlots(req: Request, res: Response) {
  try {
    const slots = await appointmentService.listAvailableSlots(Number(req.params.id));
    res.json(slots);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
}

export async function createBooking(req: Request, res: Response) {
  try {
    const { doctorId, slot, patientName, patientBirth, specialty, reason } = req.body;
    // Chama o serviço para garantir a verificação de disponibilidade e criação do protocolo
    const booking = await appointmentService.bookAppointment(Number(doctorId), slot, {
      patientName,
      patientBirth,
      specialty,
      reason
    });
    res.json(booking);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}