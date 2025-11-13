// src/app/api/upload/presign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getS3 } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function sanitizeKey(k: string) {
  const clean = k.replace(/[^a-zA-Z0-9._\-\/]/g, '_');
  if (clean.includes('..')) throw new Error('Key inválida');
  return clean;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const role = (session?.user as any)?.role;
  if (!userId) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { key, contentType, proyectoId } = await req.json();
  if (!key || typeof key !== 'string') return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  if (contentType !== 'application/pdf') return NextResponse.json({ error: 'Solo PDF' }, { status: 400 });
  if (!proyectoId) return NextResponse.json({ error: 'proyectoId requerido' }, { status: 400 });

  const proyecto = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { ownerId: true },
  });
  if (!proyecto) return NextResponse.json({ error: 'Proyecto inexistente' }, { status: 404 });

  const isOwnerAlumno = role === 'ALUMNO' && proyecto.ownerId === userId;
  const isStaff = role === 'ADMIN' || role === 'PROF';
  if (!(isOwnerAlumno || isStaff)) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const safeKey = sanitizeKey(key);
  const s3 = getS3();
  const cmd = new PutObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: safeKey, ContentType: contentType });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });

  return NextResponse.json({ url });
}
