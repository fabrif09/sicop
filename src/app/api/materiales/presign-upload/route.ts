import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getS3 } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function sanitizeKey(k: string) {
  const clean = k.replace(/[^a-zA-Z0-9._\-\/]/g, '_');
  if (clean.includes('..')) throw new Error('Key inválida');
  return clean;
}

const ALLOWED = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN'|'PROF'|'ALUMNO'|undefined;
  if (!role || !['ADMIN','PROF'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { key, contentType } = await req.json();
  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  }
  if (!contentType || !ALLOWED.has(contentType)) {
    return NextResponse.json({ error: 'Solo PDF o Word' }, { status: 400 });
  }

  // Forzar que todos los materiales vayan bajo "materiales/"
  const base = key.startsWith('materiales/') ? key : `materiales/${key}`;
  const safeKey = sanitizeKey(base);

  const s3 = getS3();
  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: safeKey,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 5 }); // 5 min
  return NextResponse.json({ url, key: safeKey });
}
