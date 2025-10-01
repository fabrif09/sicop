'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!role || !['ADMIN','PROF'].includes(role)) {
    throw new Error('No autorizado');
  }
}

export async function aprobarUsuario(formData: FormData) {
  await requireStaff();
  const id = String(formData.get('id') || '');
  if (!id) throw new Error('ID requerido');

  await prisma.user.update({
    where: { id },
    data: { isActive: true, approvedAt: new Date() },
  });

  // (opcional) auditLog
  // await prisma.auditLog.create({ data: { action: 'APROBAR_USUARIO', userId: staffId, metadata: { id } } });

  revalidatePath('/admin/usuarios');
}

export async function rechazarUsuario(formData: FormData) {
  await requireStaff();
  const id = String(formData.get('id') || '');
  if (!id) throw new Error('ID requerido');

  // Podés borrar o mantener inactivo. Yo prefiero borrar si está inactivo:
  await prisma.user.delete({ where: { id } });

  // (opcional) audit
  // await prisma.auditLog.create({ data: { action: 'RECHAZAR_USUARIO', ... } });

  revalidatePath('/admin/usuarios');
}
