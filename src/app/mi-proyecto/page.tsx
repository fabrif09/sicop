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
  const msg = sp?.m;

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

  // Proyecto ACTIVO (si existe)
  const activo = await prisma.proyecto.findFirst({
    where: { ownerId: userId, isActive: true },
    select: { id: true, titulo: true },
    orderBy: { createdAt: 'desc' },
  });

  // Lista de RECHAZADOS (históricos, inactivos)
  const rechazados = await prisma.proyecto.findMany({
    where: { ownerId: userId, isActive: false, estado: 'RECHAZADO' as any },
    select: { id: true, titulo: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 space-y-5">
        <h1 className="text-2xl font-bold text-primary text-center">Mi proyecto</h1>

        {/* Mensaje informativo si viene redirigido */}
        {msg === 'ya_tenes_proyecto' && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm rounded p-3">
            Ya tenés un proyecto creado. Te mostramos tu proyecto.
          </div>
        )}

        {/* Bloque Proyecto Activo o CTA para crear */}
        {!activo ? (
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              Todavía no cargaste tu proyecto.
            </p>
            <Link href="/proyectos/nuevo" className="btn inline-block">
              Crear proyecto
            </Link>
          </div>
        ) : (
          <div className="text-center space-y-1">
            <p className="text-gray-700">Tu proyecto activo:</p>
            <Link
              href={`/proyectos/${activo.id}`}
              className="text-blue-700 hover:underline font-medium"
            >
              {activo.titulo}
            </Link>
          </div>
        )}

        {/* Bloque Rechazados (historial) */}
        <div className="pt-2">
          <h2 className="text-lg font-semibold">Rechazados</h2>
          {rechazados.length === 0 ? (
            <p className="text-gray-600 mt-1">No tenés proyectos rechazados.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {rechazados.map((r) => (
                <li key={r.id} className="border rounded p-3 bg-white flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium break-words">{r.titulo}</div>
                    <div className="text-xs text-gray-600">
                      Rechazado el {new Date(r.createdAt).toLocaleDateString('es-AR')}
                    </div>
                  </div>
                  <Link
                    href={`/proyectos/${r.id}`}
                    className="text-blue-700 hover:underline text-sm shrink-0 ml-5"
                  >
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Si NO hay activo, CTA para crear uno nuevo (por claridad extra) */}
          {!activo && (
            <div className="text-center mt-3">
              <Link href="/proyectos/nuevo" className="btn inline-block">
                Crear nuevo proyecto
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
