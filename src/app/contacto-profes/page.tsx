import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { mailtoLink, whatsappLink } from '@/lib/contactLinks';

export default async function ContactoProfesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;

  if (!role) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No autenticado
        </div>
      </main>
    );
  }

  // Permitimos que ALUMNO (y staff) vean esta lista
  const profes = await prisma.user.findMany({
    where: { role: 'PROF', isActive: true },
    orderBy: [{ nombre: 'asc' }],
    select: { id: true, nombre: true, email: true, celular: true },
  });

  return (
    <main className="min-h-[calc(100vh-13.75rem)] px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="btn btn-ghost">←</Link>
          <h1 className="text-2xl font-bold text-primary">Profes de la cátedra</h1>
        </div>

        {profes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-4 text-gray-600">Aún no hay profesores activos.</div>
        ) : (
          <ul className="space-y-3">
            {profes.map(p => (
              <li key={p.id} className="bg-white rounded-lg shadow p-4">
                <div className="font-semibold text-blue-900">{p.nombre || 'Profesor/a'}</div>
                <div className="mt-1 flex flex-wrap  gap-3 text-sm flex-col">
                  <div className='flex gap-4'>
                    <b>Email</b>
                    {p.email && (
                      <a
                        href={mailtoLink(p.email, 'SICOP', `Hola ${p.nombre || ''},`)}
                        target='blank'
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline break-all"
                      >
                        {p.email}
                      </a>
                    )}
                  </div>
                  <div className='flex gap-4 '>
                    <b>Celular</b>
                    {p.celular && (
                      <a
                        href={whatsappLink(p.celular, 'Hola, le escribo por SICOP')}
                        target="_blank"
                        rel="noopener"
                        className="text-green-700 hover:underline"
                      >
                        {p.celular}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
