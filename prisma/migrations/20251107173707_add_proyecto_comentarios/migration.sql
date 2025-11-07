-- CreateEnum
CREATE TYPE "public"."ComentarioTipo" AS ENUM ('APROBACION', 'RECHAZO', 'FEEDBACK');

-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- CreateTable
CREATE TABLE "public"."ProyectoComentario" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "tipo" "public"."ComentarioTipo" NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProyectoComentario_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."ProyectoComentario" ADD CONSTRAINT "ProyectoComentario_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "public"."Proyecto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProyectoComentario" ADD CONSTRAINT "ProyectoComentario_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
