// tarefa3/services/appointmentService.ts

import * as doctorRepo from "../repositories/doctorRepository";

function generateProtocol(): string {
  return "P-" + Math.random().toString(36).substring(2, 9).toUpperCase();
}

/**
 * Gera todos os slots potenciais de 30 minutos para um médico no próximo mês.
 */
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

      // Garante que current não comece antes de hoje
      if (current < start) {
        current = new Date(start.getTime());
        // Arredonda para o próximo slot de 30 minutos
        const minutes = current.getMinutes();
        const remainder = minutes % 30;
        if (remainder !== 0) {
          current.setMinutes(minutes + (30 - remainder));
        }
      }
      

      while (current <= limit) {
        if (current > new Date()) slots.push(current.toISOString());
        current = new Date(current.getTime() + 30 * 60000); // Slots de 30 minutos
      }
    }
  }
  return slots;
}

/**
 * Lista os horários que um médico tem disponíveis (não reservados).
 */
export async function listAvailableSlots(doctorId: number): Promise<string[]> {
  const doctor = await doctorRepo.findDoctorById(doctorId);
  if (!doctor) throw new Error("Médico não encontrado");

  const allSlots = generateSlotsForDoctor(doctor, 1);

  const bookings = await doctorRepo.findBookingsByDoctor(doctorId);
  const reserved = bookings.map(b => b.slot.toISOString());

  // Retorna apenas slots que não estão reservados
  return allSlots.filter(s => !reserved.includes(s));
}

/**
 * Reserva um horário, verificando a disponibilidade.
 * Converte as strings de data/hora para Date antes de persistir.
 */
export async function bookAppointment(
  doctorId: number,
  slot: string, // Recebe string ISO
  patientData: { patientName: string; patientBirth: string; specialty: string; reason: string } // patientBirth string
) {
  // Verifica a disponibilidade novamente (garantia anti-concorrência básica)
  const available = await listAvailableSlots(doctorId);
  if (!available.includes(slot)) {
    throw new Error("Horário indisponível");
  }

  const protocol = generateProtocol();
  
  // **Conversão para Date antes de enviar para o repositório**
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