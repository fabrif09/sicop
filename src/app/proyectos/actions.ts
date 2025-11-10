'use server';

import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';
import { buildTextoIndexado } from '@/lib/textoIndexado';
import { revalidatePath } from 'next/cache';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

/* ===================== helpers ===================== */

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

async function crearComentarioProyecto(input: {
  proyectoId: string;
  autorId: string;
  tipo: 'APROBACION' | 'RECHAZO' | 'FEEDBACK';
  texto: string;
}) {
  // texto opcional: si viene vacío, no creamos nada
  if (!input.texto?.trim()) return;
  await prisma.proyectoComentario.create({
    data: {
      proyectoId: input.proyectoId,
      autorId: input.autorId,
      tipo: input.tipo as any,
      texto: input.texto.trim(),
    },
  });
}


/* ===================== búsqueda ===================== */

// Búsqueda difusa para staff
export async function buscarProyectos(input: { q: string; limit?: number; umbral?: number }) {
  await requireProfOrAdmin();
  const qIndex = buildTextoIndexado(input.q, '', []);
  const limit = input.limit ?? 20;
  const umbral = input.umbral ?? 0.30;

  const rows = await prisma.$queryRaw<
    { id: string; titulo: string; alumnoNombre: string; fechaCarga: Date; anio: number; score: number; ownerId: string }[]
  >`
    SELECT p.id, p.titulo, p."alumnoNombre", p."fechaCarga", p."anio", p."ownerId",
           similarity(p."textoIndexado", ${qIndex}) AS score
    FROM "Proyecto" AS p
    WHERE (p."textoIndexado" % ${qIndex} AND similarity(p."textoIndexado", ${qIndex}) >= ${umbral})
       OR (p."titulo" ILIKE ${'%' + input.q + '%'})
    ORDER BY score DESC NULLS LAST, p."createdAt" DESC
    LIMIT ${limit};
  `;
  return rows;
}

// Similaridad trigram (para aviso de posibles duplicados)
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

/* ===================== CRUD proyecto ===================== */

// Crear proyecto (queda PROPUESTO por default en el schema)
// Crear proyecto (queda PROPUESTO por default en el schema)
export async function createProyecto(input: {
  titulo: string; descripcion: string; funcionalidades: string[];
  anio: number; fechaCarga: string; // ⬅️ quitamos alumnoNombre / alumnoEmail
}) {
  const { userId, role } = await getSessionUser();

  if (role !== 'ALUMNO') {
    throw new Error('Solo los alumnos pueden crear proyectos.');
  }

  // ⬇️ Verificar que no tenga ya un proyecto ACTIVO
  const yaTieneActivo = await prisma.proyecto.count({
    where: { ownerId: userId, isActive: true },
  });
  if (yaTieneActivo > 0) {
    throw new Error('Ya tenés un proyecto activo.');
  }

  if (!input.titulo?.trim() || !input.descripcion?.trim()) throw new Error('Título y descripción son obligatorios');
  if (!input.fechaCarga) throw new Error('La fecha de carga es obligatoria');

  const fecha = new Date(input.fechaCarga);
  if (Number.isNaN(fecha.getTime())) throw new Error('Fecha de carga inválida');
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  if (fecha > hoy) throw new Error('La fecha de carga no puede ser futura');

  // ⬇️ Traemos nombre/email del usuario logueado
  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { nombre: true, email: true },
  });
  if (!owner?.nombre || !owner?.email) {
    throw new Error('Tu perfil no tiene nombre o email configurado.');
  }

  const textoIndexado = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades);

  const p = await prisma.proyecto.create({
    data: {
      titulo: input.titulo,
      descripcion: input.descripcion,
      funcionalidades: input.funcionalidades,
      alumnoNombre: owner.nombre,    // ⬅️ desde el perfil
      alumnoEmail: owner.email,      // ⬅️ desde el perfil
      anio: input.anio,
      fechaCarga: fecha,
      textoIndexado,
      ownerId: userId,               // ⬅️ dueño = alumno logueado
    },
    select: { id: true },
  });

  await log('CREAR_PROYECTO', userId, p.id);
  revalidatePath('/proyectos');
  return p.id;
}


/* ===================== documentos ===================== */

// Registrar documento (owner ALUMNO o STAFF)
export async function registrarDocumento(input: {
  proyectoId: string;
  key: string;
  mime: string;
  size: number;
  tipo: 'PROPUESTA' | 'PDF_FINAL' | 'PRESENTACION' | 'OTRO';
  version?: number; // si no lo mandan, calculo siguiente
}) {
  const { userId, role } = await getSessionUser();

  const p = await prisma.proyecto.findUnique({
    where: { id: input.proyectoId },
    select: { ownerId: true, estado: true },
  });
  if (!p) throw new Error('Proyecto inexistente');

  const isOwnerAlumno = role === 'ALUMNO' && p.ownerId === userId;
  const isStaff = role === 'ADMIN' || role === 'PROF';
  if (!(isOwnerAlumno || isStaff)) throw new Error('No autorizado');

  if (input.mime !== 'application/pdf') throw new Error('Solo PDF');
  if (input.size > 15 * 1024 * 1024) throw new Error('PDF > 15MB');

  // Regla de negocio:
  //   - Si el proyecto está PROPUESTO => solo PROPUESTA.
  //   - Si está APROBADO => permitir PDF_FINAL y PRESENTACION (además de PROPUESTA/OTRO).
  const isHistoriaAcademica =
  input.tipo === ('OTRO' as any) && typeof input.key === 'string' && input.key.includes('/historia_academica/');

if (p.estado === ('PROPUESTO' as any) && !(input.tipo === ('PROPUESTA' as any) || isHistoriaAcademica)) {
  throw new Error('Hasta que el proyecto no esté APROBADO, solo se puede subir la PROPUESTA (y la Historia Académica).');
}

  const safeKey = sanitizeKey(input.key);

  // versionado automático por tipo
  let nextVersion = input.version ?? 1;
  if (!input.version) {
    const last = await prisma.documento.findFirst({
      where: { proyectoId: input.proyectoId, tipo: input.tipo as any },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    if (last?.version) nextVersion = last.version + 1;
  }

  const doc = await prisma.documento.create({
    data: {
      proyectoId: input.proyectoId,
      tipo: input.tipo as any,
      url: safeKey,
      mime: input.mime,
      size: input.size,
      version: nextVersion,
      uploadedById: userId,
    },
    select: { id: true },
  });

  await logAudit({
    action: AuditAction.SUBIR_PDF,
    userId, // ya lo obtuviste arriba con getSessionUser()
    proyectoId: input.proyectoId,
    metadata: {
      tipo: input.tipo,
      mime: input.mime,
      size: input.size,
      key: input.key,
    },
  });
  revalidatePath(`/proyectos/${input.proyectoId}`);
  return doc;
}

/* ===================== extras ===================== */

export async function setProyectoChecksum(input: { proyectoId: string; checksum: string }) {
  const { userId, role } = await getSessionUser();
  const isStaff = role === 'ADMIN' || role === 'PROF';
  if (!isStaff) throw new Error('No autorizado');

  await prisma.proyecto.update({ where: { id: input.proyectoId }, data: { checksumPdf: input.checksum } });
  await log('EDITAR_PROYECTO', userId, input.proyectoId, { setChecksum: true });
}

export async function updateProyecto(input: {
  id: string;
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
  alumnoNombre: string;
  alumnoEmail: string;
  anio: number;
  fechaCarga: string;
  estado?: 'PROPUESTO' | 'APROBADO' | 'RECHAZADO';
}) {
  await requireProfOrAdmin();
  const session = await getServerSession(authOptions);
  const editorId = (session?.user as any)?.id as string;

  if (!input.id) throw new Error('ID requerido');

  const fecha = new Date(input.fechaCarga);
  if (Number.isNaN(fecha.getTime())) throw new Error('Fecha inválida');

  const textoIndexado = buildTextoIndexado(
    input.titulo,
    input.descripcion,
    input.funcionalidades
  );

  // Si viene un estado, derivamos isActive según la regla de negocio
  const estadoData = input.estado
    ? {
        estado: input.estado as any,
        isActive: input.estado === 'RECHAZADO' ? false : true,
      }
    : {};

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
      ...estadoData,
    },
  });

  await logAudit({
    action: AuditAction.EDITAR_PROYECTO,
    userId: editorId,
    proyectoId: input.id,
    metadata: {
      titulo: input.titulo,
      descripcion: input.descripcion,
      funcionalidades: input.funcionalidades,
      estado: input.estado ?? null,
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

/* ===================== aprobar / rechazar ===================== */

export async function aprobarProyecto(proyectoId: string, comentario?: string) {
  await requireProfOrAdmin();
  const session = await getServerSession(authOptions);
  const aprobadorId = (session?.user as any)?.id as string;

  const p = await prisma.proyecto.update({
    where: { id: proyectoId },
    data: {
      estado: 'APROBADO',
      aprobadoPorId: aprobadorId,
      aprobadoEn: new Date(),
    },
    select: { id: true },
  });

  // 💬 guardar comentario si vino
  await crearComentarioProyecto({
    proyectoId,
    autorId: aprobadorId,
    tipo: 'APROBACION',
    texto: comentario ?? '',
  });

  await log('APROBAR_PROYECTO', aprobadorId, p.id);
  await logAudit({
  action: AuditAction.APROBAR_PROYECTO, // o RECHAZAR_PROYECTO
  userId: aprobadorId,
  proyectoId,
  metadata: { comentario }, // o motivo
});
  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath('/proyectos');
}


export async function rechazarProyecto(proyectoId: string, motivo?: string) {
  await requireProfOrAdmin();

  const session = await getServerSession(authOptions);
  const aprobadorId = (session?.user as any)?.id as string;

  // Motivo obligatorio
  if (!motivo || !motivo.trim()) {
    throw new Error('Debés ingresar un motivo de rechazo.');
  }
  const motivoTrim = motivo.trim();

  // Cambia estado + soft delete
  const p = await prisma.proyecto.update({
    where: { id: proyectoId },
    data: {
      estado: 'RECHAZADO',
      isActive: false,
      aprobadoPorId: aprobadorId,
      aprobadoEn: new Date(),
    },
    select: { id: true },
  });

  //  Guardar comentario con motivo
  await crearComentarioProyecto({
    proyectoId,
    autorId: aprobadorId,
    tipo: 'RECHAZO',
    texto: motivoTrim,
  });

  //  Audit log
  await log('RECHAZAR_PROYECTO', aprobadorId, p.id, { motivo: motivoTrim });
  await logAudit({
  action: AuditAction.RECHAZAR_PROYECTO,
  userId: aprobadorId,
  proyectoId,
  metadata: { motivo }, 
});
  // Revalidate
  revalidatePath(`/proyectos/${proyectoId}`);
  revalidatePath('/proyectos');
}

// NUEVO: actualización limitada para ALUMNO dueño cuando el proyecto está APROBADO
export async function updateProyectoAlumno(input: {
  id: string;
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
  alumnoNombre?: string;   // se ignoran si vienen vacíos
  alumnoEmail?: string;
}) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as ('ADMIN'|'PROF'|'ALUMNO') | undefined;

  if (!userId || role !== 'ALUMNO') throw new Error('No autorizado');

  const p = await prisma.proyecto.findUnique({
    where: { id: input.id },
    select: { ownerId: true, estado: true },
  });
  if (!p) throw new Error('Proyecto inexistente');

  // Solo el dueño puede editar y solo si está APROBADO
  if (p.ownerId !== userId || p.estado !== 'APROBADO') {
    throw new Error('No autorizado para editar este proyecto');
  }

  if (!input.titulo?.trim() || !input.descripcion?.trim()) {
    throw new Error('Título y descripción son obligatorios');
  }

  const textoIndexado = buildTextoIndexado(input.titulo, input.descripcion, input.funcionalidades ?? []);

  await prisma.proyecto.update({
    where: { id: input.id },
    data: {
      titulo: input.titulo,
      descripcion: input.descripcion,
      funcionalidades: input.funcionalidades ?? [],
      textoIndexado,
    },
  });

  await logAudit({
    action: AuditAction.EDITAR_PROYECTO,
    userId,
    proyectoId: input.id,
    metadata: {
      titulo: input.titulo,
      descripcion: input.descripcion,
      funcionalidades: input.funcionalidades,
      editedBy: 'ALUMNO',
    },
  });

  revalidatePath(`/proyectos/${input.id}`);
  revalidatePath('/mi-proyecto');
}