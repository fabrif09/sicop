import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import DashboardContent from './DashboardContent';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? '';
  const nombre = session?.user?.name ?? '';
  const rol = (session?.user as any)?.role ?? '';

  if (!session?.user) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-start px-4">
        <h1 className="text-3xl font-bold">
          BIENVENIDO A SICOP!
        </h1>

        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center space-y-2">
          <h2 className="text-lg font-semibold text-gray-800">
            No hay sesión activa.
          </h2>
          <p className="text-gray-700">
            Ingresá con tu cuenta para continuar.
          </p>
          <Link
            href="/login"
            className="text-primary hover:underline inline-block"
          >
            Ir a login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-13.75rem)] flex flex-col items-center justify-start px-4">
      <h1 className="text-2xl font-bold text-primary mb-4 text-center mt-12">
        BIENVENIDO A SICOP!
      </h1>

      <div className="w-full max-w-[80vw] bg-white shadow-md rounded-lg p-6 space-y-6 mt-20">
        <h2 className="text-2xl font-bold text-primary text-center">
          Dashboard
        </h2>

        <DashboardContent email={email} nombre={nombre} rol={rol} />
      </div>
    </main>
  );
}
