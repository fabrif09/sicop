// src/lib/mail.ts
import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT || 587);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;

// De quién salen los correos (configuralo en .env)
const FROM = process.env.MAIL_FROM || 'SICOP <no-reply@sicop.local>';

if (!host || !user || !pass) {
  console.warn(
    '[mail] SMTP_HOST / SMTP_USER / SMTP_PASS no configurados. ' +
    'Los correos de recuperación de contraseña no se podrán enviar.'
  );
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true para 465, false para 587/25
  auth: {
    user,
    pass,
  },
});

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailOptions) {
  if (!host || !user || !pass) {
    console.warn('[mail] Falta configuración SMTP, simulando envío…');
    console.log('→ To:', to);
    console.log('→ Subject:', subject);
    console.log('→ Body:', html);
    return;
  }

  await transporter.sendMail({
    from: FROM,
    to,
    subject,
    html,
  });
}
