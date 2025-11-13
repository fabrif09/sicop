// src/app/api/proyectos/rollback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { proyectoId } = await req.json();
  if (!proyectoId) return NextResponse.json({ error: 'proyectoId requerido' }, { status: 400 });
  try {
    await prisma.proyecto.delete({ where: { id: proyectoId } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    // si ya no existe, devuelve ok para no bloquear el cliente
    return NextResponse.json({ ok: true });
  }
}
