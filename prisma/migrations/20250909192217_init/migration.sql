-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('ADMIN', 'PROF', 'ALUMNO');

-- CreateEnum
CREATE TYPE "public"."Estado" AS ENUM ('PROPUESTO', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "public"."DocTipo" AS ENUM ('PROPUESTA', 'PDF_FINAL', 'OTRO');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."Role" NOT NULL DEFAULT 'ALUMNO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Proyecto" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "funcionalidades" TEXT[],
    "alumnoNombre" TEXT NOT NULL,
    "alumnoEmail" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "fechaCarga" TIMESTAMP(3) NOT NULL,
    "estado" "public"."Estado" NOT NULL DEFAULT 'PROPUESTO',
    "textoIndexado" TEXT NOT NULL,
    "checksumPdf" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Documento" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tipo" "public"."DocTipo" NOT NULL,
    "url" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_checksumPdf_key" ON "public"."Proyecto"("checksumPdf");

-- AddForeignKey
ALTER TABLE "public"."Documento" ADD CONSTRAINT "Documento_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Extensión trigram (DB real y shadow DB)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Índice trigram para búsquedas difusas
CREATE INDEX IF NOT EXISTS "Proyecto_textoIndexado_trgm_idx"
ON "Proyecto" USING GIN ("textoIndexado" gin_trgm_ops);
