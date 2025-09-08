'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@sicop.local');
  const [password, setPassword] = useState('admin123');
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await signIn('credentials', { email, password, redirect: true, callbackUrl: '/dashboard' });
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="space-y-2 w-80">
        <h1 className="text-xl font-bold">Iniciar sesión</h1>
        <input className="border p-2 w-full" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="border p-2 w-full" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="border px-4 py-2" type="submit">Entrar</button>
      </form>
    </main>
  );
}
