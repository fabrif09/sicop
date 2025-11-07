// src/app/mi-proyecto/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export const revalidate = 0;

type Search = {
  searchParams: Promise<{ m?: string }>;
};

export default async function MiProyectoPage({ searchParams }: Search) {
  const sp = await searchParams;
  const msg = sp?.m; // 👈 leemos el parámetro "m" (mensaje opcional)

  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No autenticado
        </div>
      </main>
    );
  }

  const p = await prisma.proyecto.findFirst({
    where: { ownerId: userId },
    select: { id: true, titulo: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center space-y-4">
        <h1 className="text-2xl font-bold text-primary">Mi proyecto</h1>

        {/* Mensaje informativo si viene redirigido */}
        {msg === 'ya_tenes_proyecto' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded p-3">
            Ya tenés un proyecto creado. Te mostramos tu proyecto.
          </div>
        )}

        {!p ? (
          <>
            <p className="text-gray-700">
              Todavía no cargaste tu proyecto.
            </p>
            {/* Si querés permitir crearlo desde acá */}
            <Link
              href="/proyectos/nuevo"
              className="btn inline-block mt-2"
            >
              Crear proyecto
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-700">Tu proyecto:</p>
            <Link
              href={`/proyectos/${p.id}`}
              className="text-blue-700 hover:underline font-medium"
            >
              {p.titulo}
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
