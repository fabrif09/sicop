'use client';

import { useState } from 'react';

export default function RegistroPage() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [errMsg, setErrMsg] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrMsg(''); setOkMsg('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErrMsg('Email inválido'); return; }
    if (password.length < 6) { setErrMsg('La contraseña debe tener al menos 6 caracteres'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo registrar');
      setOkMsg('Registro enviado. Un profesor debe aprobar tu cuenta antes de poder iniciar sesión.');
      setNombre(''); setEmail(''); setPassword('');
    } catch (err:any) {
      setErrMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-sm mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Registro de alumno</h1>
      <form onSubmit={onSubmit} className="space-y-2">
        <input className="border p-2 w-full" placeholder="Nombre y apellido" value={nombre} onChange={e=>setNombre(e.target.value)} />
        <input className="border p-2 w-full" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
        {errMsg && <div className="text-red-600 text-sm">{errMsg}</div>}
        {okMsg && <div className="text-green-700 text-sm">{okMsg}</div>}
        <button disabled={loading} className="border px-4 py-2 rounded" type="submit">
          {loading ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
    </main>
  );
}
