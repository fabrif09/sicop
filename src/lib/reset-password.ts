// src/lib/reset-password.ts
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendMail } from './mail';

const APP_BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Tiempo de validez del token: 1 hora
const TOKEN_TTL_MS = 1000 * 60 * 60; // 60 min

export async function solicitarResetPassword(email: string) {
  const emailTrimmed = email.trim().toLowerCase();
  if (!emailTrimmed) return;

  // 1) Buscar usuario por email
  const user = await prisma.user.findUnique({
    where: { email: emailTrimmed },
  });

  // Importante:
  // Nunca revelamos si el email existe o no.
  // Si no existe, simplemente salimos.
  if (!user || !user.email) {
    return;
  }

  // 2) Opcional: limpiar tokens viejos de ese usuario
  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } },
      ],
    },
  });

  // 3) Generar token seguro
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  // 4) Construir URL de reseteo
  const resetUrl = `${APP_BASE_URL}/reset-password?token=${token}`;

  // 5) Enviar correo
  const nombre = user.nombre || 'usuario';

  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
      <h2>Recuperación de contraseña - SICOP</h2>
      <p>Hola ${nombre},</p>
      <p>Recibimos un pedido para restablecer tu contraseña de acceso a SICOP.</p>
      <p>Para continuar, hacé clic en el siguiente enlace (válido por 1 hora):</p>
      <p>
        <a href="${resetUrl}" style="color:#1e40af;">
          Restablecer contraseña
        </a>
      </p>
      <p>Si no fuiste vos, podés ignorar este mensaje. Tu contraseña actual seguirá funcionando.</p>
      <hr/>
      <p style="font-size: 12px; color: #555;">
        Este correo se generó automáticamente. No respondas a este mensaje.
      </p>
    </div>
  `;

  await sendMail({
    to: user.email,
    subject: 'Recuperar contraseña - SICOP',
    html,
  });
}
