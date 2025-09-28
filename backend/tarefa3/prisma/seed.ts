// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Função auxiliar para gerar datas e horários disponíveis para 30 dias
function generateAvailableSlots(doctorId: number, days: number, specialtyId: number): any[] {
  const slots: any[] = [];
  const start = new Date();
  start.setHours(0, 0, 0, 0); // Começa a partir de hoje

  // Regras de disponibilidade por dia da semana (0=Dom, 1=Seg, ..., 6=Sáb)
  // Define os horários de trabalho: 9h, 10h, 11h, 14h, 15h, 16h
  const workSchedule = {
    // Exemplo para Segunda (1), Quarta (3) e Sexta (5): 
    ana: {
      days: [1, 3, 5],
      times: [9, 10, 11, 14, 15], // 5 horários
    },
    // Exemplo para Terça (2) e Quinta (4):
    bruno: {
      days: [2, 4],
      times: [10, 11, 14, 15], // 4 horários
    }
  };

  // Define qual schedule usar baseado na especialidade (simulação)
  const schedule = (specialtyId === 1) ? workSchedule.ana : workSchedule.bruno; 

  for (let i = 0; i < days; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dayOfWeek = day.getDay(); // 0 (Domingo) a 6 (Sábado)

    // Verifica se o dia da semana está na agenda do médico
    if (schedule.days.includes(dayOfWeek)) {
      schedule.times.forEach(hour => {
        const slot = new Date(day);
        slot.setHours(hour, 0, 0, 0);

        // Adiciona o slot, mas apenas se for no futuro (para evitar agendamento no passado)
        if (slot.getTime() > new Date().getTime()) {
          slots.push({
            doctorId: doctorId,
            dateTime: slot,
            isAvailable: true,
          });
        }
      });
    }
  }
  return slots;
}

async function main() {
  console.log('Iniciando o Seed...');

  // 1. Criar Especialidades
  const cardiologia = await prisma.specialty.create({ data: { name: 'Cardiologia' } });
  const dermatologia = await prisma.specialty.create({ data: { name: 'Dermatologia' } });

  console.log('Especialidades criadas.');

  // 2. Criar Médicos (com CRM e ligação à especialidade)
  const ana = await prisma.doctor.create({
    data: {
      name: 'Dra. Ana Souza',
      crm: 'CRM/SP 123456',
      city: 'São Paulo',
      specialtyId: cardiologia.id,
    },
  });

  const bruno = await prisma.doctor.create({
    data: {
      name: 'Dr. Bruno Lima',
      crm: 'CRM/RJ 654321',
      city: 'Rio de Janeiro',
      specialtyId: dermatologia.id,
    },
  });
  
  console.log('Médicos criados.');

  // 3. Gerar Slots de Horários Disponíveis para 30 dias (prazo de 1 mês)
  const slotsAna = generateAvailableSlots(ana.id, 30, cardiologia.id);
  const slotsBruno = generateAvailableSlots(bruno.id, 30, dermatologia.id);
  
  await prisma.availableHour.createMany({ data: slotsAna });
  await prisma.availableHour.createMany({ data: slotsBruno });

  console.log(`Foram gerados ${slotsAna.length + slotsBruno.length} horários disponíveis.`);
  console.log('Seed concluído com sucesso.');
}

main()
  .catch((e) => {
    console.error('Erro no Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });