/*
  Warnings:

  - A unique constraint covering the columns `[proyectoId,tipo,version]` on the table `Documento` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[dni]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "public"."DocTipo" ADD VALUE 'PRESENTACION';

-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "celular" TEXT,
ADD COLUMN     "dni" TEXT,
ADD COLUMN     "egresado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fechaRindio" TIMESTAMP(3),
ADD COLUMN     "nota" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Documento_proyectoId_tipo_version_key" ON "public"."Documento"("proyectoId", "tipo", "version");

-- CreateIndex
CREATE UNIQUE INDEX "User_dni_key" ON "public"."User"("dni");
