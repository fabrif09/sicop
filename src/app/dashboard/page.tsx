import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import LogoutBtn from '../components/LogoutBtn';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  return (
    <main className="p-6 space-y-3">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {!session?.user ? (
        <p>No hay sesión. <Link className="underline" href="/login">Ir a login</Link></p>
      ) : (
        <div className="space-y-1">
          <p><b>Usuario:</b> {session.user.email}</p>
          <p><b>Nombre:</b> {session.user.name}</p>
          <p><b>Rol:</b> {(session.user as any).role}</p>
          <Link className="underline mr-3" href="/proyectos">Ver proyectos</Link>
          <Link className="underline" href="/proyectos/nuevo">Crear proyecto</Link>
          <LogoutBtn />
        </div>
      )}
    </main>
  );
}
