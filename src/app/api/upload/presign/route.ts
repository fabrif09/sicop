import { NextRequest, NextResponse } from 'next/server';
import { getS3 } from '@/lib/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: NextRequest) {
  const { key, contentType } = await req.json();

  // validaciones mínimas
  if (!key || typeof key !== 'string') return NextResponse.json({ error: 'key requerida' }, { status: 400 });
  if (contentType !== 'application/pdf') return NextResponse.json({ error: 'Solo PDF' }, { status: 400 });

  const s3 = getS3();
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    ContentType: contentType,
  });
  const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 }); // 5 min
  return NextResponse.json({ url });
}
