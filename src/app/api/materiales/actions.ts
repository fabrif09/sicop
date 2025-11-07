'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

function isWord(mime: string) {
  return mime === 'application/msword' ||
         mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
}
function isPdf(mime: string) {
  return mime === 'application/pdf';
}

function assertAllowedMime(m: string) {
  if (!(isPdf(m) || isWord(m))) throw new Error('Solo PDF o Word');
}

function sanitizeKey(k: string) {
  const clean = k.replace(/[^a-zA-Z0-9._\\-\\/]/g, '_');
  if (clean.includes('..')) throw new Error('Key inválida');
  return clean;
}

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN'|'PROF'|'ALUMNO'|undefined;
  if (!role || !['ADMIN','PROF'].includes(role)) {
    throw new Error('No autorizado');
  }
  return session;
}

export async function listarMateriales() {
  // cualquier usuario autenticado
  return prisma.materialCatedra.findMany({
    orderBy: [{ categoria: 'asc' }, { titulo: 'asc' }],
    select: {
      id: true, titulo: true, descripcion: true, categoria: true,
      key: true, mime: true, size: true, version: true, createdAt: true,
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
  if (input.size <= 0 || input.size > 20 * 1024 * 1024) throw new Error('Archivo demasiado grande (máx 20MB)');

  // Forzar prefix
  const base = input.key.startsWith('materiales/') ? input.key : `materiales/${input.key}`;
  const safeKey = sanitizeKey(base);

  await prisma.materialCatedra.create({
    data: {
      titulo: input.titulo.trim(),
      descripcion: input.descripcion?.trim() || null,
      categoria: input.categoria?.trim() || null,
      key: safeKey,
      mime: input.mime,
      size: input.size,
      uploadedById: (session?.user as any).id,
    },
  });

  revalidatePath('/materiales');
}

export async function borrarMaterial(id: string) {
  await requireStaff();
  await prisma.materialCatedra.delete({ where: { id } });
  revalidatePath('/materiales');
}

// Reemplazo: crea nueva versión manteniendo título/categoría/desc pero con key/mime/size nuevos
export async function reemplazarMaterial(input: { id: string; key: string; mime: string; size: number }) {
  await requireStaff();
  assertAllowedMime(input.mime);

  // buscar versión anterior
  const m = await prisma.materialCatedra.findUnique({ where: { id: input.id } });
  if (!m) throw new Error('Material inexistente');

  const base = input.key.startsWith('materiales/') ? input.key : `materiales/${input.key}`;
  const safeKey = sanitizeKey(base);

  await prisma.materialCatedra.update({
    where: { id: input.id },
    data: {
      key: safeKey,
      mime: input.mime,
      size: input.size,
      version: (m.version ?? 1) + 1,
    },
  });

  revalidatePath('/materiales');
}
