'use server';

import { prisma } from '@/lib/prisma';
import { buildTextoIndexado } from '@/lib/textoIndexado';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

async function getSessionUser() {
  const session = await getServerSession(authOptions);

  let userId = (session?.user as any)?.id as string | undefined;
  let role = (session?.user as any)?.role as ('ADMIN'|'PROF'|'ALUMNO') | undefined;

  // Fallback por si id/role no llegaron en session.user
  if ((!userId || !role) && session?.user?.email) {
    const u = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (u) {
      userId = u.id;
      role = u.role as any;
    }
  }

  if (!userId) throw new Error('No autenticado');
  return { userId, role };
}

async function requireProfOrAdmin() {
  const { role } = await getSessionUser();
  if (!role || !['ADMIN', 'PROF'].includes(role)) {
    throw new Error('No autorizado');
  }
}

function sanitizeKey(k: string) {
  const clean = k.replace(/[^a-zA-Z0-9._\-\/]/g, '_');
  if (clean.includes('..')) throw new Error('Key inválida');
  return clean;
}

async function log(action: string, userId: string, proyectoId?: string, metadata?: any) {
  await prisma.auditLog.create({
    data: { action: action as any, userId, proyectoId, metadata },
  });
}

// ---- BÚSQUEDA DIFUSA (para profes) opcional: si ya lo tenías, dejalo igual ----
export async function buscarProyectos(input: { q: string; limit?: number; umbral?: number }) {
  await requireProfOrAdmin();
  const q = buildTextoIndexado(input.q, '', []);
  const limit = input.limit ?? 20;
  const umbral = input.umbral ?? 0.30;

  const rows = await prisma.$queryRaw<
    { id: string; titulo: string; alumnoNombre: string; fechaCarga: Date; anio: number; score: number }[]
  >`
    SELECT p.id, p.titulo, p."alumnoNombre", p."fechaCarga", p."anio",
           similarity(p."textoIndexado", ${q}) AS score
    FROM "Proyecto" AS p
    WHERE (p."textoIndexado" % ${q} AND similarity(p."textoIndexado", ${q}) >= ${umbral})
       OR (p."titulo" ILIKE ${'%' + q + '%'})
    ORDER BY score DESC NULLS LAST, p."createdAt" DESC
    LIMIT ${limit};
  `;
  return rows;
}

// ---- SIMILARES (lo puede usar alumno también) ----
export async function buscarSimilaresTrgm(input: {
  titulo: string; descripcion: string; funcionalidades: string[]; limit?: number; umbral?: number;
}) {
  const texto = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades);
  const limit = input.limit ?? 5;
  const umbral = input.umbral ?? 0.35;

  const rows = await prisma.$queryRaw<
    { id: string; titulo: string; alumnoNombre: string; fechaCarga: Date; score: number }[]
  >`
    SELECT id, titulo, "alumnoNombre", "fechaCarga",
           similarity("textoIndexado", ${texto}) AS score
    FROM "Proyecto"
    WHERE "textoIndexado" % ${texto}
      AND similarity("textoIndexado", ${texto}) >= ${umbral}
    ORDER BY score DESC
    LIMIT ${limit};
  `;
  return rows;
}

// ---- CREAR PROYECTO (ALUMNO crea + queda APROBADO) ----
export async function createProyecto(input: {
  titulo: string; descripcion: string; funcionalidades: string[];
  alumnoNombre: string; alumnoEmail: string;
  anio: number; fechaCarga: string; // yyyy-mm-dd
}) {
  const { userId } = await getSessionUser();

  if (!input.titulo?.trim() || !input.descripcion?.trim()) throw new Error('Título y descripción son obligatorios');
  if (!input.alumnoNombre?.trim() || !input.alumnoEmail?.trim()) throw new Error('Datos del alumno obligatorios');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.alumnoEmail)) throw new Error('Email inválido');
  if (!input.fechaCarga) throw new Error('La fecha de carga es obligatoria');

  const fecha = new Date(input.fechaCarga);
  if (Number.isNaN(fecha.getTime())) throw new Error('Fecha de carga inválida');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  if (fecha > hoy) throw new Error('La fecha de carga no puede ser futura');

  const textoIndexado = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades);

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
      ownerId: userId,
      estado: 'APROBADO', // 👈 simplificado
    },
    select: { id: true },
  });

  await log('CREAR_PROYECTO', userId, p.id);
  revalidatePath('/proyectos');
  return p.id;
}

// ---- REGISTRAR DOCUMENTO (ALUMNO owner o STAFF) ----
export async function registrarDocumento(input: {
  proyectoId: string; key: string; mime: string; size: number;
  tipo: 'PROPUESTA' | 'PDF_FINAL' | 'OTRO'; version?: number;
}) {
  const { userId, role } = await getSessionUser();

  const p = await prisma.proyecto.findUnique({ where: { id: input.proyectoId }, select: { ownerId: true } });
  if (!p) throw new Error('Proyecto inexistente');

  const isOwnerAlumno = role === 'ALUMNO' && p.ownerId === userId;
  const isStaff = role === 'ADMIN' || role === 'PROF';
  if (!(isOwnerAlumno || isStaff)) throw new Error('No autorizado');

  if (input.mime !== 'application/pdf') throw new Error('Solo PDF');
  if (input.size > 15 * 1024 * 1024) throw new Error('PDF > 15MB');

  const safeKey = sanitizeKey(input.key);

  const doc = await prisma.documento.create({
    data: {
      proyectoId: input.proyectoId,
      tipo: input.tipo as any,
      url: safeKey,
      mime: input.mime,
      size: input.size,
      version: input.version ?? 1,
      uploadedById: userId,
    },
    select: { id: true },
  });

  await log('SUBIR_PDF', userId, input.proyectoId, { key: safeKey, size: input.size, tipo: input.tipo });
  revalidatePath(`/proyectos/${input.proyectoId}`);
  return doc;
}

// ---- CHECKSUM opcional (si lo usás) ----
export async function setProyectoChecksum(input: { proyectoId: string; checksum: string }) {
  const { userId, role } = await getSessionUser();
  const isStaff = role === 'ADMIN' || role === 'PROF';
  if (!isStaff) throw new Error('No autorizado');

  await prisma.proyecto.update({ where: { id: input.proyectoId }, data: { checksumPdf: input.checksum } });
  await log('EDITAR_PROYECTO', userId, input.proyectoId, { setChecksum: true });
}

// ---- UPDATE/DELETE (solo staff) ----
export async function updateProyecto(input: {
  id: string; titulo: string; descripcion: string; funcionalidades: string[];
  alumnoNombre: string; alumnoEmail: string; anio: number; fechaCarga: string;
  estado?: 'PROPUESTO' | 'APROBADO' | 'RECHAZADO';
}) {
  await requireProfOrAdmin();

  if (!input.id) throw new Error('ID requerido');

  const fecha = new Date(input.fechaCarga);
  if (Number.isNaN(fecha.getTime())) throw new Error('Fecha inválida');

  const textoIndexado = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades);

  await prisma.proyecto.update({
    where: { id: input.id },
    data: {
      titulo: input.titulo,
      descripcion: input.descripcion,
      funcionalidades: input.funcionalidades,
      alumnoNombre: input.alumnoNombre,
      alumnoEmail: input.alumnoEmail,
      anio: input.anio,
      fechaCarga: fecha,
      textoIndexado,
      ...(input.estado ? { estado: input.estado as any } : {}),
    },
  });

  revalidatePath(`/proyectos/${input.id}`);
  revalidatePath('/proyectos');
}

export async function deleteProyecto(input: { proyectoId: string }) {
  await requireProfOrAdmin();
  await prisma.proyecto.delete({ where: { id: input.proyectoId } });
  revalidatePath('/proyectos');
}
