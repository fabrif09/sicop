import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password } = await req.json();
    if (!nombre?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email' }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        passwordHash: hash,
        role: 'ALUMNO',     // por defecto
        isActive: false,    // 👈 queda pendiente
        requestedAt: new Date(),
      },
    });

    // (opcional) audit log
    // await prisma.auditLog.create({ data: { action: 'CREAR_USUARIO_PENDIENTE', userId: ??? } });

    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: 'Error de servidor' }, { status: 500 });
  }
}
