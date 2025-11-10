-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."AuditAction" ADD VALUE 'CREAR_USUARIO';
ALTER TYPE "public"."AuditAction" ADD VALUE 'APROBAR_USUARIO';
ALTER TYPE "public"."AuditAction" ADD VALUE 'RECHAZAR_USUARIO';
ALTER TYPE "public"."AuditAction" ADD VALUE 'EDITAR_USUARIO';
ALTER TYPE "public"."AuditAction" ADD VALUE 'CAMBIAR_PASSWORD';
ALTER TYPE "public"."AuditAction" ADD VALUE 'SUBIR_MATERIAL';
ALTER TYPE "public"."AuditAction" ADD VALUE 'REEMPLAZAR_MATERIAL';
ALTER TYPE "public"."AuditAction" ADD VALUE 'BORRAR_MATERIAL';
ALTER TYPE "public"."AuditAction" ADD VALUE 'DESCARGAR_MATERIAL';
ALTER TYPE "public"."AuditAction" ADD VALUE 'VER_PDF';

-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_action_idx" ON "public"."AuditLog"("createdAt", "action");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "public"."AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_proyectoId_createdAt_idx" ON "public"."AuditLog"("proyectoId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetUserId_createdAt_idx" ON "public"."AuditLog"("targetUserId", "createdAt");
