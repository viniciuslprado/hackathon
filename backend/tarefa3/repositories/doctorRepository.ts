import { PrismaClient, Doctor, Booking } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Busca médicos com base em filtros (especialidade e/ou cidade).
 */
export async function findDoctors(filters: { specialty?: string; city?: string }): Promise<Doctor[]> {
  return prisma.doctor.findMany({
    where: {
      specialty: filters.specialty ? { equals: filters.specialty, mode: "insensitive" } : undefined,
      city: filters.city ? { equals: filters.city, mode: "insensitive" } : undefined,
    }
  });
}

/**
 * Busca um médico pelo ID, incluindo seus horários de disponibilidade.
 */
export async function findDoctorById(id: number) {
  return prisma.doctor.findUnique({
    where: { id },
    include: { hours: true }
  });
}

/**
 * Busca todos os agendamentos de um médico.
 */
export async function findBookingsByDoctor(doctorId: number): Promise<Booking[]> {
  return prisma.booking.findMany({ where: { doctorId } });
}

/**
 * Cria um novo agendamento no banco de dados.
 * Recebe as datas já no formato Date.
 */
export async function createBooking(
  doctorId: number,
  slot: Date, // Já vem como Date do Service
  protocol: string,
  patientData: { patientName: string; patientBirth: Date; specialty: string; reason: string } // patientBirth já é Date
) {
  return prisma.booking.create({
    data: {
      doctorId,
      slot,
      protocol,
      patientName: patientData.patientName,
      patientBirth: patientData.patientBirth,
      specialty: patientData.specialty,
      reason: patientData.reason,
    },
    include: { doctor: true }
  });
}