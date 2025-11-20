// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (!res) {
        setErrorMsg('Error inesperado');
        return;
      }

      if (res.error) {
        setErrorMsg(res.error);
        return;
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Error de autenticación');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-primary mb-4 text-center">
          Ingresar
        </h1>

        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full rounded-lg border border-gray-300 bg-white p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          {/* Campo de contraseña con botón de ojo */}
          <div className="relative">
            <input
              className="w-full rounded-lg border border-gray-300 bg-white p-2 pr-40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              type={showPassword ? 'text' : 'password'}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Link a registro */}
          <div className="text-sm text-center">
            <Link
              href="/registro"
              className="text-primary hover:underline"
            >
              Crear cuenta
            </Link>
            <Link
              href="/recuperar-contrasena"
              className="text-primary hover:underline block"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Mensajes de error */}
          {errorMsg && (
            <div className="text-red-600 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <button
            disabled={loading}
            className="btn w-full"
            type="submit"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  );
}
