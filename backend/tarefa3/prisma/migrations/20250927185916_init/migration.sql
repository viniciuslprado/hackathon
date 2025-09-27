-- CreateTable
CREATE TABLE "public"."Doctor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "city" TEXT NOT NULL,

    CONSTRAINT "Doctor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoctorAvailableHour" (
    "id" SERIAL NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "doctorId" INTEGER NOT NULL,

    CONSTRAINT "DoctorAvailableHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Booking" (
    "id" SERIAL NOT NULL,
    "protocol" TEXT NOT NULL,
    "slot" TIMESTAMP(3) NOT NULL,
    "doctorId" INTEGER NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientBirth" TIMESTAMP(3) NOT NULL,
    "specialty" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_protocol_key" ON "public"."Booking"("protocol");

-- AddForeignKey
ALTER TABLE "public"."DoctorAvailableHour" ADD CONSTRAINT "DoctorAvailableHour_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Booking" ADD CONSTRAINT "Booking_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "public"."Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
