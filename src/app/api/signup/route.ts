import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { nombre, email, password, celular, dni } = await req.json();

    // Validaciones básicas
    if (!nombre?.trim() || !email?.trim() || !password?.trim() || !celular?.trim() || !dni?.trim()) {
      return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    if (!/^\d{6,12}$/.test(dni)) {
      return NextResponse.json({ error: 'DNI inválido (solo números de 6 a 12 dígitos)' }, { status: 400 });
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
        role: 'ALUMNO',
        celular: celular.trim(),
        dni: dni.trim(),
        isActive: false, // pendiente de aprobación
        requestedAt: new Date(),
      },
    });

    return NextResponse.json({
      ok: true,
      message: 'Registro exitoso. Un profesor debe aprobar tu cuenta antes de poder iniciar sesión.',
    });
  } catch (e: any) {
    console.error('Error en /api/signup:', e);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
