-- AlterEnum
ALTER TYPE "public"."AuditAction" ADD VALUE 'ENVIAR_EMAIL';

-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";
