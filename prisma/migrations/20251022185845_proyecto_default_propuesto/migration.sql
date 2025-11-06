-- AlterTable
ALTER TABLE "public"."Proyecto" ALTER COLUMN "estado" SET DEFAULT 'PROPUESTO';

-- Aseguramos la extensión y el índice trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Proyecto_textoIndexado_trgm_idx"
  ON "Proyecto" USING GIN ("textoIndexado" gin_trgm_ops);