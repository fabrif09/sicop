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
  const role = (session?.user as any)?.role;
  if (!role || !['ADMIN', 'PROF'].includes(role)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
  }

  const { key } = await req.json();
  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  }
  if (!key.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Solo PDF' }, { status: 400 });
  }

  const safeKey = sanitizeKey(key);

  const s3 = getS3();
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: safeKey,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 3 }); // 3 min
  return NextResponse.json({ url });
}
