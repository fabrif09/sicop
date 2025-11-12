/*
  Warnings:

  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."AuditAction" ADD VALUE 'EDITAR_CONTACTO_USUARIO';

-- DropForeignKey
ALTER TABLE "public"."Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- DropTable
DROP TABLE "public"."Notification";

-- DropEnum
DROP TYPE "public"."NotificationType";
