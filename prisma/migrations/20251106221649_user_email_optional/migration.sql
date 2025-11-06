-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- AlterTable
ALTER TABLE "public"."User" ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "passwordHash" DROP NOT NULL;
