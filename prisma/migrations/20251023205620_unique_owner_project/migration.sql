/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `Proyecto` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_ownerId_key" ON "public"."Proyecto"("ownerId");
