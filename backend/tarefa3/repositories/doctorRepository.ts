import { PrismaClient, Doctor, Booking } from "@prisma/client";

const prisma = new PrismaClient();

export async function findDoctors(filters: { specialty?: string; city?: string }): Promise<Doctor[]> {
  return prisma.doctor.findMany({
    where: {
      specialty: filters.specialty ? { equals: filters.specialty, mode: "insensitive" } : undefined,
      city: filters.city ? { equals: filters.city, mode: "insensitive" } : undefined,
    }
  });
}

export async function findDoctorById(id: number) {
  return prisma.doctor.findUnique({
    where: { id },
    include: { hours: true }
  });
}

export async function findBookingsByDoctor(doctorId: number): Promise<Booking[]> {
  return prisma.booking.findMany({ where: { doctorId } });
}

export async function createBooking(
  doctorId: number,
  slot: Date,
  protocol: string,
  patientData: { patientName: string; patientBirth: Date; specialty: string; reason: string }
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