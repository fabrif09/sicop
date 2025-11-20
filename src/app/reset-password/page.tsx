// src/app/reset-password/page.tsx
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

type Search = {
  searchParams: Promise<{
    token?: string;
    error?: string;
    invalid?: string;
    expired?: string;
    used?: string;
  }>;
};

// Server Action: procesa el cambio de contraseña
async function resetPasswordAction(formData: FormData) {
  'use server';

  const token = String(formData.get('token') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();
  const confirm = String(formData.get('confirm') ?? '').trim();

  if (!token) {
    throw new Error('Token faltante');
  }

  if (!password || password.length < 8) {
    // Podrías mejorar esto con un mecanismo de error más fino,
    // pero para simplificar redirigimos de nuevo con un flag.
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=weak`);
  }

  if (password !== confirm) {
    redirect(`/reset-password?token=${encodeURIComponent(token)}&error=nomatch`);
  }

  // Buscar el token en BD
  const now = new Date();
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    redirect('/reset-password?invalid=1');
  }

  if (resetToken.usedAt) {
    redirect('/reset-password?used=1');
  }

  if (resetToken.expiresAt < now) {
    redirect('/reset-password?expired=1');
  }

  // Todo OK → actualizar contraseña y marcar token como usado
  const hash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: hash },
    }),
    prisma.passwordResetToken.update({
      where: { token },
      data: { usedAt: now },
    }),
  ]);

  // Opcional: podrías invalidar otros tokens de ese usuario aquí con deleteMany

  // Redirigir al login con un flag de éxito
  redirect('/login?reset=1');
}

export default async function ResetPasswordPage({ searchParams }: Search) {
  const sp = await searchParams;
  const token = sp?.token?.trim() ?? '';
  const error = sp?.error;
  const invalid = sp?.invalid === '1';
  const expired = sp?.expired === '1';
  const used = sp?.used === '1';

  let tokenState: 'missing' | 'invalid' | 'expired' | 'used' | 'valid' = 'valid';

  if (!token) {
    tokenState = 'missing';
  } else if (invalid) {
    tokenState = 'invalid';
  } else if (expired) {
    tokenState = 'expired';
  } else if (used) {
    tokenState = 'used';
  } else {
    // Si no viene ningún flag de error en query, verificamos el token en BD
    const rt = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    const now = new Date();

    if (!rt) {
      tokenState = 'invalid';
    } else if (rt.usedAt) {
      tokenState = 'used';
    } else if (rt.expiresAt < now) {
      tokenState = 'expired';
    } else {
      tokenState = 'valid';
    }
  }

  const showWeakError = error === 'weak';
  const showNoMatchError = error === 'nomatch';

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary text-center">
          Restablecer contraseña
        </h1>

        {tokenState !== 'valid' ? (
          <div className="space-y-3 text-sm text-center">
            {tokenState === 'missing' && (
              <p className="text-gray-700">
                Falta el token de recuperación. Volvé a solicitar el enlace de recuperación.
              </p>
            )}
            {tokenState === 'invalid' && (
              <p className="text-gray-700">
                El enlace de recuperación no es válido. Podés solicitar uno nuevo.
              </p>
            )}
            {tokenState === 'expired' && (
              <p className="text-gray-700">
                El enlace de recuperación ha expirado. Solicitá uno nuevo para continuar.
              </p>
            )}
            {tokenState === 'used' && (
              <p className="text-gray-700">
                Este enlace de recuperación ya fue utilizado. Si necesitás cambiar tu contraseña de nuevo, solicitá un nuevo enlace.
              </p>
            )}

            <a
              href="/recuperar-contraseña"
              className="inline-block mt-2 text-primary hover:underline"
            >
              Volver a solicitar enlace
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 text-center">
              Ingresá tu nueva contraseña. Asegurate de que sea segura y fácil de recordar.
            </p>

            {(showWeakError || showNoMatchError) && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {showWeakError && (
                  <p>La contraseña debe tener al menos 8 caracteres.</p>
                )}
                {showNoMatchError && (
                  <p>Las contraseñas no coinciden. Verificalas e intentá de nuevo.</p>
                )}
              </div>
            )}

            <form action={resetPasswordAction} className="space-y-4">
              {/* Token oculto */}
              <input type="hidden" name="token" value={token} />

              <div>
                <label className="block text-sm mb-1" htmlFor="password">
                  Nueva contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm mb-1" htmlFor="confirm">
                  Repetir contraseña
                </label>
                <input
                  id="confirm"
                  name="confirm"
                  type="password"
                  className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  minLength={8}
                  required
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className="btn w-full"
              >
                Guardar nueva contraseña
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
