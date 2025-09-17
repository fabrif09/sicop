'use server';

import { prisma } from '@/lib/prisma';
import { buildTextoIndexado } from '@/lib/textoIndexado';
import { revalidatePath } from 'next/cache';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/lib/auth';

export async function buscarSimilaresTrgm(input: {
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
  limit?: number;
  umbral?: number; // 0..1
}) {
  const texto = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades);
  const limit = input.limit ?? 5;
  const umbral = input.umbral ?? 0.35;

const rows = await prisma.$queryRaw<
    { id: string; titulo: string; alumnoNombre: string; fechaCarga: Date; score: number }[]
  >`
    SELECT id,
           titulo,
           "alumnoNombre",
           "fechaCarga",
           similarity("textoIndexado", ${texto}) AS score
    FROM "Proyecto"
    WHERE "textoIndexado" % ${texto}
      AND similarity("textoIndexado", ${texto}) >= ${umbral}
    ORDER BY score DESC
    LIMIT ${limit};
  `;
  return rows;
}

export async function registrarDocumento(input: {
  proyectoId: string;
  key: string;          // guardamos la Key S3 (recomendado)
  mime: string;         // 'application/pdf'
  size: number;         // bytes
  tipo: 'PROPUESTA' | 'PDF_FINAL' | 'OTRO';
  version?: number;
}) {
  if (input.mime !== 'application/pdf') throw new Error('Solo PDF');
  return prisma.documento.create({
    data: {
      proyectoId: input.proyectoId,
      tipo: input.tipo as any,
      url: input.key, // 🔴 guardo la Key, no una URL prefirmada
      mime: input.mime,
      size: input.size,
      version: input.version ?? 1,
    },
    select: { id: true },
  });
}

export async function setProyectoChecksum(input: { proyectoId: string; checksum: string }) {
  await prisma.proyecto.update({
    where: { id: input.proyectoId },
    data: { checksumPdf: input.checksum },
  });
}


export async function createProyecto(input: {
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
  alumnoNombre: string;
  alumnoEmail: string;
  anio: number;
  fechaCarga: string; // yyyy-mm-dd
}) {
  // Gate de rol (activar más adelante si querés)
  // const session = await getServerSession(authOptions);
  // const role = (session?.user as any)?.role;
  // if (!role || !['ADMIN', 'PROF'].includes(role)) throw new Error('No autorizado');

  if (!input.titulo?.trim() || !input.descripcion?.trim()) {
    throw new Error('Título y descripción son obligatorios');
  }
  if (!input.alumnoNombre?.trim() || !input.alumnoEmail?.trim()) {
    throw new Error('Datos del alumno obligatorios');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.alumnoEmail)) {
    throw new Error('Email inválido');
  }
  if (!input.fechaCarga) throw new Error('La fecha de carga es obligatoria');

  const fecha = new Date(input.fechaCarga);
  if (Number.isNaN(fecha.getTime())) throw new Error('Fecha de carga inválida');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  if (fecha > hoy) throw new Error('La fecha de carga no puede ser futura');

  const textoIndexado = buildTextoIndexado(
    input.titulo,
    input.descripcion,
    input.funcionalidades
  );

  const p = await prisma.proyecto.create({
    data: {
      titulo: input.titulo,
      descripcion: input.descripcion,
      funcionalidades: input.funcionalidades,
      alumnoNombre: input.alumnoNombre,
      alumnoEmail: input.alumnoEmail,
      anio: input.anio,
      fechaCarga: fecha,
      textoIndexado,
    },
    select: { id: true },
  });

  // No revalidate acá todavía; lo hacemos al final del flujo
  return p.id;
}

export async function deleteProyecto(input: { proyectoId: string }) {
  await prisma.proyecto.delete({ where: { id: input.proyectoId } });
}
