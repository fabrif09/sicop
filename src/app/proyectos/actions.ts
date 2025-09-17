'use server';

import { PrismaClient } from '@prisma/client';
import { buildTextoIndexado } from '@/lib/textoIndexado';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function buscarSimilaresTrgm(input: {
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
  limit?: number;
  umbral?: number; // 0..1
}) {
  const texto = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades);
  const limit = input.limit ?? 5;
  const umbral = input.umbral ?? 0.35; // ajustable (0.30–0.45)

  const rows = await prisma.$queryRaw<
    { id: string; titulo: string; score: number }[]
  >`
    SELECT id, titulo, similarity("textoIndexado", ${texto}) AS score
    FROM "Proyecto"
    WHERE "textoIndexado" % ${texto}
      AND similarity("textoIndexado", ${texto}) >= ${umbral}
    ORDER BY score DESC
    LIMIT ${limit};
  `;
  return rows;
}

export async function createProyecto(input: {
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
  alumnoNombre: string;
  alumnoEmail: string;
  anio: number;
  fechaCarga: string; // ISO date desde el form
}) {
  if (!input.titulo?.trim() || !input.descripcion?.trim()) throw new Error('Título y descripción son obligatorios');
  if (!input.alumnoNombre?.trim() || !input.alumnoEmail?.trim()) throw new Error('Datos del alumno obligatorios');
  if (!input.fechaCarga) throw new Error('La fecha de carga es obligatoria');
  const textoIndexado = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades);

  await prisma.proyecto.create({
    data: {
      titulo: input.titulo,
      descripcion: input.descripcion,
      funcionalidades: input.funcionalidades,
      alumnoNombre: input.alumnoNombre,
      alumnoEmail: input.alumnoEmail,
      anio: input.anio,
      fechaCarga: new Date(input.fechaCarga), // convertir a Date
      textoIndexado,
    },
  });

  revalidatePath('/proyectos');
}
