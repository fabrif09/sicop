'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';
import { revalidatePath } from 'next/cache';

export async function cambiarPassword(formData: FormData) {
  const session = await getServerSession(authOptions);
  const actorId  = (session?.user as any)?.id as string | undefined;
  const actorRol = (session?.user as any)?.role as Role | undefined;

  if (!actorId) throw new Error('No autenticado');

  const targetUserId = String(formData.get('userId') || '');
  const current      = String(formData.get('current') || '');
  const nextPass     = String(formData.get('next') || '');
  const confirm      = String(formData.get('confirm') || '');

  if (!targetUserId) throw new Error('Falta usuario');
  if (!nextPass || !confirm) throw new Error('Completá la nueva contraseña');
  if (nextPass !== confirm) throw new Error('Las contraseñas no coinciden');
  if (nextPass.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres');

  // Solo el propio usuario o un ADMIN pueden cambiarla
  const isSelf  = actorId === targetUserId;
  const isAdmin = actorRol === 'ADMIN';
  if (!isSelf && !isAdmin) throw new Error('No autorizado');

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, passwordHash: true },
  });
  if (!user) throw new Error('Usuario no encontrado');

  // Si el usuario ya tenía password, exigimos la actual (salvo que sea ADMIN actuando sobre otro)
  const hadPassword = !!user.passwordHash;
  if (hadPassword && !isSelf && isAdmin === true) {
    // ADMIN puede setear sin la actual
  } else if (hadPassword) {
    if (!current) throw new Error('Ingresá tu contraseña actual');
    const ok = await bcrypt.compare(current, user.passwordHash as string);
    if (!ok) throw new Error('La contraseña actual no es válida');
  }

  // Evitar reutilizar la misma contraseña
  if (hadPassword) {
    const same = await bcrypt.compare(nextPass, user.passwordHash as string);
    if (same) throw new Error('La nueva contraseña no puede ser igual a la actual');
  }

  const newHash = await bcrypt.hash(nextPass, 12);

  await prisma.user.update({
    where: { id: targetUserId },
    data: { passwordHash: newHash },
  });

  // Si el formulario está en /usuarios/[id]
  revalidatePath(`/usuarios/${targetUserId}`);
}
