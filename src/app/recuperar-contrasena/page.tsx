// src/app/recpuerar-contrasena/page.tsx
import { solicitarResetPassword } from '@/lib/reset-password';
import { redirect } from 'next/navigation';

type Search = {
  searchParams: Promise<{
    sent?: string;
  }>;
};

// Server Action
async function handleReset(formData: FormData) {
  'use server';

  const email = String(formData.get('email') ?? '').trim();
  if (!email) {
    redirect('/recuperar-contrasena?sent=1');
  }

  await solicitarResetPassword(email);

  redirect('/recuperar-contrasena?sent=1');
}

export default async function RecuperarContrasenaPage({ searchParams }: Search) {
  const sp = await searchParams;
  const sent = sp?.sent === '1';

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">
          Recuperar contraseña
        </h1>

        <p className="text-sm text-gray-600 text-center">
          Ingresá tu email y, si existe una cuenta asociada, te enviaremos un enlace
          para restablecer tu contraseña.
        </p>

        {sent && (
          <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
            Si el correo existe en el sistema, se envió un enlace para restablecer la contraseña.
            Revisá tu bandeja de entrada (y spam).
          </div>
        )}

        <form action={handleReset} className="space-y-4">
          <input
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            type="email"
            name="email"
            placeholder="Email"
            required
            autoComplete="email"
          />

          <button
            type="submit"
            className="btn w-full"
          >
            Enviar enlace
          </button>
        </form>
      </div>
    </main>
  );
}
