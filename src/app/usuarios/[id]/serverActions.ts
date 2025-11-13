// src/app/usuarios/[id]/serverActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

//  helper logAudit:
async function logAudit(entry: {
  action: AuditAction;
  userId: string;
  targetUserId?: string | null;
  proyectoId?: string | null;
  metadata?: any;
}) {
  await prisma.auditLog.create({
    data: {
      action: entry.action,
      userId: entry.userId,
      targetUserId: entry.targetUserId ?? null,
      proyectoId: entry.proyectoId ?? null,
      metadata: entry.metadata ?? {},
    },
  });
}

export async function cambiarPassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  const actorId = (session?.user as any)?.id as string | undefined;

  if (!actorId) {
    throw new Error('No autenticado');
  }

  const current = String(formData.get('current') ?? '');
  const nextPwd = String(formData.get('next') ?? '');
  const confirm  = String(formData.get('confirm') ?? '');

  if (!current || !nextPwd || !confirm) throw new Error('Campos obligatorios');
  if (nextPwd !== confirm) throw new Error('Las contraseñas no coinciden');
  if (nextPwd.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres');

  const u = await prisma.user.findUnique({
    where: { id: actorId },
    select: { passwordHash: true },
  });
  if (!u) throw new Error('Usuario no encontrado');

  if (!u.passwordHash) throw new Error('Tu cuenta no tiene contraseña local configurada');
  const ok = await bcrypt.compare(current, u.passwordHash);
  if (!ok) throw new Error('La contraseña actual es incorrecta');

  const newHash = await bcrypt.hash(nextPwd, 12);

  await prisma.user.update({
    where: { id: actorId },
    data: { passwordHash: newHash },
  });

  // Audit: quien hace el cambio y sobre quién (self-service)
  await logAudit({
    action: AuditAction.CAMBIAR_PASSWORD,
    userId: actorId,
    targetUserId: actorId,
    metadata: { selfService: true },
  });

  revalidatePath(`/usuarios/${actorId}`);
}
