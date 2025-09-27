import * as doctorRepo from "../repositories/doctorRepository";

function generateProtocol(): string {
  return "P-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

function generateSlotsForDoctor(doctor: any, monthsAhead = 1): string[] {
  const slots: string[] = [];
  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + monthsAhead);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const weekday = d.getDay();

    const hoursForDay = doctor.hours.filter((h: any) => h.weekday === weekday);

    for (const h of hoursForDay) {
      let current = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h.start.getHours(), h.start.getMinutes());
      const limit = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h.end.getHours(), h.end.getMinutes());

      while (current <= limit) {
        if (current > new Date()) slots.push(current.toISOString());
        current = new Date(current.getTime() + 30 * 60000);
      }
    }
  }
  return slots;
}

export async function listAvailableSlots(doctorId: number): Promise<string[]> {
  const doctor = await doctorRepo.findDoctorById(doctorId);
  if (!doctor) throw new Error("Médico não encontrado");

  const allSlots = generateSlotsForDoctor(doctor, 1);

  const bookings = await doctorRepo.findBookingsByDoctor(doctorId);
  const reserved = bookings.map(b => b.slot.toISOString());

  return allSlots.filter(s => !reserved.includes(s));
}

export async function bookAppointment(
  doctorId: number,
  slot: string,
  patientData: { patientName: string; patientBirth: string; specialty: string; reason: string }
) {
  const available = await listAvailableSlots(doctorId);
  if (!available.includes(slot)) {
    throw new Error("Horário indisponível");
  }

  const protocol = generateProtocol();
  return doctorRepo.createBooking(
    doctorId,
    new Date(slot),
    protocol,
    {
      patientName: patientData.patientName,
      patientBirth: new Date(patientData.patientBirth),
      specialty: patientData.specialty,
      reason: patientData.reason
    }
  );
}