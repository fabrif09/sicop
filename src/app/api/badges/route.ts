// src/app/api/badges/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // evita cachear en build/edge
export const revalidate = 0;            // no-cache en App Router

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ pendingUsers: 0, pendingPropuestas: 0 }, { status: 401 });
  }

  // mismos criterios que en Header.tsx
  const [pendingUsers, pendingPropuestas] = await Promise.all([
    prisma.user.count({ where: { isActive: false, isDeleted: false } }),
    prisma.proyecto.count({ where: { estado: 'PROPUESTO', isActive: true } }),
  ]);

  return NextResponse.json(
    { pendingUsers, pendingPropuestas },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
