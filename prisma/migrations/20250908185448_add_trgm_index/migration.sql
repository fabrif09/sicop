-- Habilitamos la extensión en la DB donde se aplica la migración (incluye la shadow DB)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ahora sí, el índice trigram
CREATE INDEX IF NOT EXISTS "Proyecto_textoIndexado_trgm_idx"
ON "Proyecto" USING GIN ("textoIndexado" gin_trgm_ops);
