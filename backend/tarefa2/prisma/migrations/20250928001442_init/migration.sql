-- CreateTable
CREATE TABLE "public"."ProcedimentoSaude" (
    "id" SERIAL NOT NULL,
    "Código" INTEGER NOT NULL,
    "terminologia" TEXT NOT NULL,
    "correlacao" TEXT NOT NULL,
    "PROCEDIMENTO" TEXT NOT NULL,
    "resolucaoNormativa" TEXT,
    "VIGÊNCIA" TIMESTAMP(3) NOT NULL,
    "OD" TEXT,
    "AMB" TEXT,
    "HCO" TEXT,
    "HSO" TEXT,
    "PAC" TEXT,
    "DUT" TEXT,
    "SUBGRUPO" TEXT NOT NULL,
    "GRUPO" TEXT NOT NULL,
    "CAPÍTULO" TEXT NOT NULL,

    CONSTRAINT "ProcedimentoSaude_pkey" PRIMARY KEY ("id")
);
