// src/app/api/materiales/presign-get/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getS3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

function sanitizeKey(k: string) {
  const clean = k.replace(/[^a-zA-Z0-9._\-\/]/g, '_');
  if (clean.includes('..')) throw new Error('Key inválida');
  return clean;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const { key } = await req.json();
  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  }

  // Seguridad: solo servir claves bajo "materiales/"
  if (!key.startsWith('materiales/')) {
    return NextResponse.json({ error: 'Key no permitida' }, { status: 403 });
  }

  const safeKey = sanitizeKey(key);
  const s3 = getS3();
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: safeKey,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 });
  return NextResponse.json({ url });
}
