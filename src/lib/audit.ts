// src/lib/audit.ts
'use server';

import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';

type LogInput = {
  action: AuditAction;
  userId: string;
  proyectoId?: string | null;
  targetUserId?: string | null;
  metadata?: Record<string, any> | null;
};

export async function logAudit(input: LogInput) {
  const { action, userId, proyectoId, targetUserId, metadata } = input;
  try {
    await prisma.auditLog.create({
      data: {
        action,
        userId,
        proyectoId: proyectoId ?? undefined,
        targetUserId: targetUserId ?? undefined,
        metadata: metadata ? (metadata as any) : undefined,
      },
    });
  } catch {
    // No reventar el flujo principal por el log
  }
}
