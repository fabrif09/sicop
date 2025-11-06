-- DropIndex
DROP INDEX "public"."Proyecto_textoIndexado_trgm_idx";

-- CreateTable
CREATE TABLE "public"."MaterialCatedra" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "key" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaterialCatedra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MaterialCatedra_key_key" ON "public"."MaterialCatedra"("key");

-- AddForeignKey
ALTER TABLE "public"."MaterialCatedra" ADD CONSTRAINT "MaterialCatedra_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
