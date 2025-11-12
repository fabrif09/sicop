'use client';

import { useState, useTransition, useRef } from 'react';
import { cambiarPassword } from './serverActions';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ChangePasswordForm({
  userId,
  hasPassword,
}: {
  userId: string;
  hasPassword: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // 👈 nuevo estado
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      {/* Botón para mostrar/ocultar el form */}
      <button
        type="button"
        onClick={() => setShowForm((s) => !s)}
        className="btn flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
      >
        <Lock size={16} />
        {showForm ? 'Cerrar formulario' : 'Cambiar contraseña'}
      </button>

      {/* Formulario visible solo si showForm es true */}
      {showForm && (
        <form
          ref={formRef}
          action={async (fd) => {
            setMsg(null);
            setErr(null);
            start(async () => {
              try {
                await cambiarPassword(fd);
                setMsg('Contraseña actualizada correctamente.');
                formRef.current?.reset();
                setShowForm(false);
              } catch (e: any) {
                setErr(e?.message ?? 'No se pudo cambiar la contraseña');
              }
            });
          }}
          className="space-y-3 mt-4 transition-all duration-200"
        >
          <input type="hidden" name="userId" value={userId} />

          {hasPassword && (
            <div className="space-y-1 relative">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña actual
              </label>
              <input
                id="cpw-current"
                name="current"
                type={showPassword ? 'text' : 'password'}
                className="border rounded w-full p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 bottom-2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          )}

          <div className="space-y-1 relative">
            <label className="block text-sm font-medium text-gray-700">
              Nueva contraseña
            </label>
            <input
              id="cpw-next"
              name="next"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              required
              className="border rounded w-full p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 bottom-2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="space-y-1 relative">
            <label className="block text-sm font-medium text-gray-700">
              Confirmar nueva contraseña
            </label>
            <input
              id="cpw-confirm"
              name="confirm"
              type={showPassword ? 'text' : 'password'}
              minLength={8}
              required
              className="border rounded w-full p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              placeholder="Repetí la nueva contraseña"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 bottom-2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border rounded px-3 py-2 hover:bg-gray-50 text-sm"
            >
              Cancelar
            </button>
            <button
              disabled={pending}
              className="btn bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              {pending ? 'Guardando…' : 'Actualizar'}
            </button>
          </div>

          {msg && <p className="text-green-700 text-sm">{msg}</p>}
          {err && <p className="text-red-700 text-sm">{err}</p>}
        </form>
      )}
    </div>
  );
}
