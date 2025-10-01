-- DropIndex
-- DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- AlterTable
ALTER TABLE "public"."Proyecto" ALTER COLUMN "estado" SET DEFAULT 'APROBADO';

-- AlterTable
ALTER TABLE "public"."User"
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Aseguramos la extensión y el índice trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Proyecto_textoIndexado_trgm_idx"
  ON "Proyecto" USING GIN ("textoIndexado" gin_trgm_ops);
