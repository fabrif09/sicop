-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- AlterTable
ALTER TABLE "public"."Proyecto" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
