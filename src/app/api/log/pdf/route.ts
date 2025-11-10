// src/app/api/log/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { AuditAction } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = (session?.user as any)?.id as string | undefined;
  if (!uid) return NextResponse.json({ error: 'No auth' }, { status: 401 });

  const { proyectoId, url } = await req.json() as { proyectoId?: string; url: string };

  await logAudit({
    action: AuditAction.VER_PDF,
    userId: uid,
    proyectoId: proyectoId ?? undefined,
    metadata: { url },
  });

  return NextResponse.json({ ok: true });
}
