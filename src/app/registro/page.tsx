'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function RegistroPage() {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    celular: '',
    dni: '',
    fechaRindio: '',
    nota: '',
    egresado: false,
  });

  const [okMsg, setOkMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg('');
    setOkMsg('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setErrMsg('Email inválido');
      return;
    }
    if (form.password.length < 6) {
      setErrMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!form.nombre.trim() || !form.dni.trim() || !form.celular.trim()) {
      setErrMsg('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo registrar');

      setOkMsg('Registro enviado. Un profesor debe aprobar tu cuenta antes de poder iniciar sesión.');
      setForm({
        nombre: '',
        email: '',
        password: '',
        celular: '',
        dni: '',
        fechaRindio: '',
        nota: '',
        egresado: false,
      });
    } catch (err: any) {
      setErrMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-sm bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center text-primary mb-4">
          Crear cuenta
        </h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="nombre"
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            placeholder="Nombre y apellido"
            value={form.nombre}
            onChange={handleChange}
            required
          />

          <input
            name="email"
            type="email"
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            name="password"
            type="password"
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            placeholder="Contraseña"
            value={form.password}
            onChange={handleChange}
            required
          />

          <input
            name="celular"
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            placeholder="Celular"
            value={form.celular}
            onChange={handleChange}
            required
          />

          <input
            name="dni"
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            placeholder="DNI"
            value={form.dni}
            onChange={handleChange}
            required
          />

          {errMsg && <div className="text-red-600 text-sm">{errMsg}</div>}
          {okMsg && <div className="text-green-700 text-sm">{okMsg}</div>}

          <button
            disabled={loading}
            className="btn w-full"
            type="submit"
          >
            {loading ? 'Registrando...' : 'Registrarme'}
          </button>
        </form>

        <p className="text-center text-sm mt-3 text-gray-700">
          ¿Ya tenés cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
