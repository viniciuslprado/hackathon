/*
  Warnings:

  - You are about to drop the column `reason` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `slot` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `specialty` on the `Booking` table. All the data in the column will be lost.
  - You are about to drop the column `specialty` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the `DoctorAvailableHour` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[availableHourId]` on the table `Booking` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[crm]` on the table `Doctor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `availableHourId` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reasonConsultation` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `crm` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialtyId` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."DoctorAvailableHour" DROP CONSTRAINT "DoctorAvailableHour_doctorId_fkey";

-- AlterTable
ALTER TABLE "public"."Booking" DROP COLUMN "reason",
DROP COLUMN "slot",
DROP COLUMN "specialty",
ADD COLUMN     "availableHourId" INTEGER NOT NULL,
ADD COLUMN     "reasonConsultation" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Doctor" DROP COLUMN "specialty",
ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "crm" TEXT NOT NULL,
ADD COLUMN     "specialtyId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "public"."DoctorAvailableHour";

-- CreateTable
CREATE TABLE "public"."Specialty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AvailableHour" (
    "id" SERIAL NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AvailableHour_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "public"."Specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_availableHourId_key" ON "public"."Booking"("availableHourId");

-- CreateIndex
CREATE UNIQUE INDEX "Doctor_crm_key" ON "public"."Doctor"("crm");

-- AddForeignKey
ALTER TABLE "public"."Doctor" ADD CONSTRAINT "Doctor_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "public"."Specialty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AvailableHour" ADD CONSTRAINT "AvailableHour_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_availableHourId_fkey" FOREIGN KEY ("availableHourId") REFERENCES "public"."AvailableHour"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
