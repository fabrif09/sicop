// src/lib/notifier.ts
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { AuditAction } from '@prisma/client';

const smtp = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
});

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  extra?: Record<string, any>
) {
  await smtp.sendMail({
    from: process.env.SMTP_FROM || '"SICOP" <no-reply@sicop.local>',
    to,
    subject,
    html,
  });

  
  await prisma.auditLog.create({
    data: {
      action: (AuditAction as any).ENVIAR_EMAIL || ('ENVIAR_EMAIL' as any),
      // no hay usuario asociado directamente al envío → se usa una relación opcional
      user: {
        connectOrCreate: {
          where: { id: 'system' },
          create: { id: 'system', nombre: 'Sistema', email: 'no-reply@sicop.local', role: 'ADMIN' },
        },
      },
      metadata: { to, subject, ...(extra || {}) },
    },
  });
}

/* ========= Notificaciones ========= */

export async function notifyAccountApproved(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { nombre: true, email: true },
  });
  if (!u?.email) return;
  await sendEmail(
    u.email,
    'Tu cuenta en SICOP fue aprobada',
    `<p>Hola ${u.nombre || ''}, tu cuenta fue <b>aprobada</b>. Ya podés ingresar a SICOP.</p>`
  );
}

export async function notifyAccountRejected(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { nombre: true, email: true },
  });
  if (!u?.email) return;
  await sendEmail(
    u.email,
    'Tu cuenta en SICOP fue rechazada',
    `<p>Hola ${u.nombre || ''}, tu solicitud de cuenta fue <b>rechazada</b>.</p>`
  );
}

export async function notifyProjectApproved(proyectoId: string) {
  const p = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { titulo: true, owner: { select: { email: true, nombre: true } } },
  });
  if (!p?.owner?.email) return;
  await sendEmail(
    p.owner.email,
    'Tu proyecto fue aprobado',
    `<p>Hola ${p.owner.nombre || ''}, tu proyecto <b>${p.titulo}</b> fue <b>aprobado</b>. Ya podés subir los demás PDFs.</p>`,
    { proyectoId }
  );
}

export async function notifyProjectRejected(proyectoId: string, motivo: string) {
  const p = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { titulo: true, owner: { select: { email: true, nombre: true } } },
  });
  if (!p?.owner?.email) return;
  await sendEmail(
    p.owner.email,
    'Tu proyecto fue rechazado',
    `<p>Hola ${p.owner.nombre || ''}, tu proyecto <b>${p.titulo}</b> fue <b>rechazado</b>.<br/>Motivo: ${motivo}</p>`,
    { proyectoId }
  );
}

export async function notifyNewComment(proyectoId: string) {
  const p = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { titulo: true, owner: { select: { email: true, nombre: true } } },
  });
  if (!p?.owner?.email) return;
  await sendEmail(
    p.owner.email,
    'Nuevo comentario en tu proyecto',
    `<p>Hola ${p.owner.nombre || ''}, tu proyecto <b>${p.titulo}</b> recibió un nuevo comentario de un profesor.</p>`,
    { proyectoId }
  );
}
