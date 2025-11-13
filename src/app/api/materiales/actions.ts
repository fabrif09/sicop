// src/app/api/materiales/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { AuditAction } from '@prisma/client';
import { logAudit } from '@/lib/audit';

function isWord(mime: string) {
  return (
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );
}
function isPdf(mime: string) {
  return mime === 'application/pdf';
}

function assertAllowedMime(m: string) {
  if (!(isPdf(m) || isWord(m))) throw new Error('Solo PDF o Word');
}

function sanitizeKey(k: string) {
  const clean = k.replace(/[^a-zA-Z0-9._\-\/]/g, '_');
  if (clean.includes('..')) throw new Error('Key inválida');
  return clean;
}

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;
  if (!role || !['ADMIN', 'PROF'].includes(role)) {
    throw new Error('No autorizado');
  }
  return session;
}

export async function listarMateriales() {
  // cualquier usuario autenticado
  return prisma.materialCatedra.findMany({
    orderBy: [{ categoria: 'asc' }, { titulo: 'asc' }],
    select: {
      id: true,
      titulo: true,
      descripcion: true,
      categoria: true,
      key: true,
      mime: true,
      size: true,
      version: true,
      createdAt: true,
    },
  });
}

export async function registrarMaterial(input: {
  titulo: string;
  descripcion?: string;
  categoria?: string;
  key: string;
  mime: string;
  size: number;
}) {
  const session = await requireStaff();
  if (!input.titulo?.trim()) throw new Error('Título requerido');
  assertAllowedMime(input.mime);
  if (input.size <= 0 || input.size > 20 * 1024 * 1024)
    throw new Error('Archivo demasiado grande (máx 20MB)');

  // Forzar prefix
  const base = input.key.startsWith('materiales/') ? input.key : `materiales/${input.key}`;
  const safeKey = sanitizeKey(base);

  // Chequeo de colisión de nombre/clave antes de crear
  const collision = await prisma.materialCatedra.findFirst({
    where: { key: safeKey },
    select: { id: true, titulo: true },
  });
  if (collision) {
    throw new Error('Ya existe un material con ese nombre. Usá "Reemplazar" o renombrá el archivo y probá de nuevo.');
  }

  const created = await prisma.materialCatedra.create({
    data: {
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim() || null,
      categoria: input.categoria?.trim() || null,
      key: safeKey,
      mime: input.mime,
      size: input.size,
      uploadedById: (session?.user as any).id,
    },
    select: {
      id: true,
      titulo: true,
      categoria: true,
      key: true,
      mime: true,
      size: true,
      version: true,
    },
  });

  // Audit log: subir material
  await logAudit({
    action: AuditAction.SUBIR_MATERIAL,
    userId: (session?.user as any).id,
    metadata: {
      materialId: created.id,
      titulo: created.titulo,
      categoria: created.categoria,
      key: created.key,
      mime: created.mime,
      size: created.size,
      version: created.version,
    },
  });

  revalidatePath('/materiales');
}

export async function borrarMaterial(id: string) {
  const session = await requireStaff();

  // Traer datos para el log antes de borrar
  const m = await prisma.materialCatedra.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      categoria: true,
      key: true,
      mime: true,
      size: true,
      version: true,
    },
  });
  if (!m) throw new Error('Material inexistente');

  await prisma.materialCatedra.delete({ where: { id } });

  // Audit log: borrar material
  await logAudit({
    action: AuditAction.BORRAR_MATERIAL,
    userId: (session?.user as any).id,
    metadata: {
      materialId: m.id,
      titulo: m.titulo,
      categoria: m.categoria,
      key: m.key,
      mime: m.mime,
      size: m.size,
      version: m.version,
    },
  });

  revalidatePath('/materiales');
}

// Reemplazo: crea nueva versión manteniendo título/categoría/desc pero con key/mime/size nuevos
export async function reemplazarMaterial(input: {
  id: string;
  key: string;
  mime: string;
  size: number;
}) {
  const session = await requireStaff();
  assertAllowedMime(input.mime);

  // buscar versión anterior
  const m = await prisma.materialCatedra.findUnique({
    where: { id: input.id },
    select: {
      id: true,
      titulo: true,
      categoria: true,
      key: true,
      mime: true,
      size: true,
      version: true,
    },
  });
  if (!m) throw new Error('Material inexistente');

  const base = input.key.startsWith('materiales/') ? input.key : `materiales/${input.key}`;
  const safeKey = sanitizeKey(base);
  const newVersion = (m.version ?? 1) + 1;

  // chequeo de colisión antes del update
  const collision = await prisma.materialCatedra.findFirst({
    where: { key: safeKey, NOT: { id: input.id } },
    select: { id: true, titulo: true },
  });
  if (collision) {
    throw new Error(
      'Ya existe otro material con ese nombre. Renombrá el archivo y volvé a intentar.'
    );
  }

  const updated = await prisma.materialCatedra.update({
    where: { id: input.id },
    data: {
      key: safeKey,
      mime: input.mime,
      size: input.size,
      version: newVersion,
    },
    select: {
      id: true,
      key: true,
      mime: true,
      size: true,
      version: true,
    },
  });

  // Audit log: reemplazar material
  await logAudit({
    action: AuditAction.REEMPLAZAR_MATERIAL,
    userId: (session?.user as any).id,
    metadata: {
      materialId: m.id,
      titulo: m.titulo,
      categoria: m.categoria,
      // antes
      oldKey: m.key,
      oldMime: m.mime,
      oldSize: m.size,
      oldVersion: m.version,
      // después
      newKey: updated.key,
      newMime: updated.mime,
      newSize: updated.size,
      newVersion: updated.version,
    },
  });

  revalidatePath('/materiales');
}
