import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  // Médicos
  const ana = await prisma.doctor.create({
    data: { name: "Dra. Ana Souza", specialty: "Cardiologia", city: "São Paulo" }
  });

  const bruno = await prisma.doctor.create({
    data: { name: "Dr. Bruno Lima", specialty: "Dermatologia", city: "Rio de Janeiro" }
  });

  // Horários da Dra. Ana (segunda, quarta, sexta das 09h às 16h)
  await prisma.doctorAvailableHour.createMany({
    data: [
      { doctorId: ana.id, weekday: 1, start: new Date("1970-01-01T09:00:00Z"), end: new Date("1970-01-01T16:00:00Z") },
      { doctorId: ana.id, weekday: 3, start: new Date("1970-01-01T09:00:00Z"), end: new Date("1970-01-01T16:00:00Z") },
      { doctorId: ana.id, weekday: 5, start: new Date("1970-01-01T09:00:00Z"), end: new Date("1970-01-01T16:00:00Z") },
    ]
  });

  // Horários do Dr. Bruno (terça e quinta das 10h às 15h)
  await prisma.doctorAvailableHour.createMany({
    data: [
      { doctorId: bruno.id, weekday: 2, start: new Date("1970-01-01T10:00:00Z"), end: new Date("1970-01-01T15:00:00Z") },
      { doctorId: bruno.id, weekday: 4, start: new Date("1970-01-01T10:00:00Z"), end: new Date("1970-01-01T15:00:00Z") },
    ]
  });
}

main()
  .then(() => console.log("Seed concluído!"))
  .finally(() => prisma.$disconnect());