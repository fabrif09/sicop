import { NextRequest, NextResponse } from 'next/server';
import { getS3 } from '@/lib/s3';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(req: NextRequest) {
  const { key } = await req.json();
  if (!key) return NextResponse.json({ error: 'key requerida' }, { status: 400 });

  const s3 = getS3();
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  });
  const url = await getSignedUrl(s3, cmd, { expiresIn: 60 * 3 }); // 3 min
  return NextResponse.json({ url });
}
