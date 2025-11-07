// src/app/api/files/presign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getS3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // 👈 nuevo

function sanitizeKey(k: string) {
  const clean = k.replace(/[^a-zA-Z0-9._\-\/]/g, '_');
  if (clean.includes('..')) throw new Error('Key inválida');
  return clean;
}

export async function POST(req: NextRequest) {
  // --- auth base ---
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as 'ADMIN'|'PROF'|'ALUMNO'|undefined;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  // --- input ---
  const { key } = await req.json();
  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  }
  if (!key.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Solo PDF' }, { status: 400 });
  }

  const safeKey = sanitizeKey(key);

  // --- autorización: staff o dueño del proyecto al que pertenece la key ---
  const isStaff = role === 'ADMIN' || role === 'PROF';

  // 1) intentar inferir proyectoId desde la key: "proyectos/{id}/..."
  let proyectoId: string | undefined = safeKey.match(/^proyectos\/([^/]+)\//)?.[1];

  // 2) si no, buscar por DB (por si cambia el patrón de la key)
  if (!proyectoId) {
    const doc = await prisma.documento.findFirst({
      where: { url: safeKey },
      select: { proyectoId: true },
    });
    proyectoId = doc?.proyectoId;
  }

  if (!proyectoId) {
    return NextResponse.json({ error: 'Key inválida' }, { status: 400 });
  }

  // 3) verificar ownership
  const p = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { ownerId: true },
  });
  const isOwner = p?.ownerId === userId;

  if (!(isStaff || isOwner)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  // --- presign GET ---
  const s3 = getS3();
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: safeKey,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 3 }); // 3 min

  return NextResponse.json({ url });
}
