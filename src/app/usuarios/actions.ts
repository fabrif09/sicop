'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { AuditAction, Role } from '@prisma/client';
import { isValidEmail, normalizePhone, isValidPhone } from '@/lib/validators';
import { revalidatePath } from 'next/cache';

async function getViewer() {
  const session = await getServerSession(authOptions);
  const viewerId = (session?.user as any)?.id as string | undefined;
  const viewerRole = (session?.user as any)?.role as Role | undefined;
  if (!viewerId || !viewerRole) throw new Error('No autenticado');
  return { viewerId, viewerRole };
}

// 2.a Alumno edita su propio contacto (nombre + celular)
export async function updateOwnContact(input: {
  nombre: string;
  celular?: string;
}) {
  const { viewerId, viewerRole } = await getViewer();
  if (viewerRole !== 'ALUMNO') throw new Error('No autorizado');

  const nombre = (input.nombre ?? '').trim();
  if (!nombre) throw new Error('El nombre es obligatorio');

  const celularDigits = normalizePhone(input.celular);
  if (celularDigits && !isValidPhone(celularDigits)) {
    throw new Error('Celular inválido');
  }

  await prisma.user.update({
    where: { id: viewerId },
    data: { nombre, celular: celularDigits || null },
  });

  await logAudit({
    action: AuditAction.EDITAR_CONTACTO_USUARIO as any,
    userId: viewerId,
    targetUserId: viewerId,
    metadata: { scope: 'SELF', nombre, celular: celularDigits || null },
  });

  revalidatePath(`/usuarios/${viewerId}`);
}

// 2.b Profesor/Admin corrige contacto de un alumno (nombre + email + celular)
export async function updateAlumnoContact(input: {
  userId: string;
  nombre?: string;
  email?: string;
  celular?: string;
}) {
  const { viewerId, viewerRole } = await getViewer();
  if (!['ADMIN', 'PROF'].includes(viewerRole)) throw new Error('No autorizado');

  const u = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, role: true, email: true, nombre: true, celular: true },
  });
  if (!u) throw new Error('Usuario inexistente');
  if (u.role === 'ADMIN') throw new Error('No se puede editar a un ADMIN');

  const data: any = {};

  if (typeof input.nombre === 'string') {
    const nombre = input.nombre.trim();
    if (!nombre) throw new Error('El nombre es obligatorio');
    data.nombre = nombre;
  }

  if (typeof input.email === 'string') {
    const email = input.email.trim();
    if (!isValidEmail(email)) throw new Error('Email inválido');
    // Prisma ya debería tener unique en email. Si choca, tira P2002 (capturable si querés).
    data.email = email.toLowerCase();
  }

  if (typeof input.celular === 'string') {
    const digits = normalizePhone(input.celular);
    if (digits && !isValidPhone(digits)) throw new Error('Celular inválido');
    data.celular = digits || null;
  }

  if (Object.keys(data).length === 0) return;

  await prisma.user.update({ where: { id: u.id }, data });

  await logAudit({
    action: AuditAction.EDITAR_CONTACTO_USUARIO as any,
    userId: viewerId,
    targetUserId: u.id,
    metadata: { scope: 'STAFF', ...data },
  });

  revalidatePath(`/usuarios/${u.id}`);
  revalidatePath(`/admin/usuarios`);
}
