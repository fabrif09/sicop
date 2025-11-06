-- asegurar extensión en DB real y shadow DB
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- índice trigram
CREATE INDEX IF NOT EXISTS "Proyecto_textoIndexado_trgm_idx"
ON "Proyecto" USING GIN ("textoIndexado" gin_trgm_ops);
