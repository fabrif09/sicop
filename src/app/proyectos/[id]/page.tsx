// src/app/proyectos/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Uploaders from './Uploaders';
import VerPdfBtn from './VerPdfBtn';
import Link from 'next/link';
import DeleteBtn from './DeleteBtn';
import { revalidatePath } from 'next/cache';

export default async function ProyectoDetail({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;
  const { id } = await params;

  if (!userId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No autenticado
        </div>
      </main>
    );
  }

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: {
      documentos: true,
      aprobadoPor: { select: { nombre: true, email: true } }, // ✅ para mostrar quién aprobó
    },
  });

  if (!proyecto) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No existe
        </div>
      </main>
    );
  }

  const isOwner = proyecto.ownerId === userId;
  const isStaff = role === 'ADMIN' || role === 'PROF';

  if (!(isOwner || isStaff)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center space-y-1">
          <h1 className="text-xl font-semibold">No autorizado</h1>
          <p className="text-gray-600">No podés ver proyectos de otros alumnos.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-13.75rem)] px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          {/* HEADER */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold text-primary">{proyecto.titulo}</h1>

            {isStaff && (
              <div className="flex items-center gap-2">
                <Link className="btn" href={`/proyectos/${proyecto.id}/editar`}>
                  Editar
                </Link>
                <DeleteBtn id={proyecto.id} />
              </div>
            )}
          </div>

          {/* --- BLOQUE APROBAR/RECHAZAR --- */}
          {isStaff && proyecto.estado === 'PROPUESTO' && (
            <div className="flex items-center gap-2 mt-4">
              {/* Aprobar */}
              <form
                action={async () => {
                  'use server';
                  const { aprobarProyecto } = await import('../actions');
                  await aprobarProyecto(proyecto.id);
                  revalidatePath(`/proyectos/${proyecto.id}`);
                }}
              >
                <button type="submit" className="btn bg-green-600 hover:bg-green-700">
                  Aprobar
                </button>
              </form>

              {/* Rechazar */}
              <form
                action={async (formData: FormData) => {
                  'use server';
                  const motivo = String(formData.get('motivo') || '');
                  const { rechazarProyecto } = await import('../actions');
                  await rechazarProyecto(proyecto.id, motivo);
                  revalidatePath(`/proyectos/${proyecto.id}`);
                }}
                className="flex items-center gap-2"
              >
                <input name="motivo" className="border p-2 rounded" placeholder="Motivo (opcional)" />
                <button type="submit" className="btn bg-red-600 hover:bg-red-700">
                  Rechazar
                </button>
              </form>
            </div>
          )}

          {/* --- DETALLES --- */}
          <div className="mt-6 space-y-4">
            {/* ESTADO Y FECHA DE APROBACIÓN */}
            <section>
              <h4 className="text-lg font-semibold">Estado</h4>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    proyecto.estado === 'APROBADO'
                      ? 'bg-green-100 text-green-700'
                      : proyecto.estado === 'RECHAZADO'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {proyecto.estado}
                </span>
                {proyecto.estado === 'APROBADO' && proyecto.aprobadoEn && (
                  <span className="ml-2 text-gray-600 text-sm">
                    (Aprobado el{' '}
                    {new Date(proyecto.aprobadoEn).toLocaleDateString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {proyecto.aprobadoPor?.nombre && (
                      <>
                        {' '}por <b>{proyecto.aprobadoPor.nombre}</b>
                      </>
                    )}
                    )
                  </span>
                )}
              </p>
            </section>

            <section>
              <h4 className="text-lg font-semibold">Descripción</h4>
              <p className="text-gray-700 mt-1">{proyecto.descripcion}</p>
            </section>

            <section>
              <h4 className="text-lg font-semibold">Funcionalidades</h4>
              <ul className="list-disc list-inside text-gray-800 mt-1">
                {proyecto.funcionalidades.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </section>

            <section>
              <h4 className="text-lg font-semibold">Documentos</h4>

              <ul className="space-y-2 mt-1">
                {proyecto.documentos.map((doc) => (
                  <li
                    key={doc.id}
                    className="border p-3 rounded flex items-center justify-between hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">
                        {doc.tipo} — v{doc.version} — {(doc.size / 1024).toFixed(1)} KB
                      </div>
                      <div className="text-sm text-gray-600">{doc.mime}</div>
                    </div>
                    <VerPdfBtn keyS3={doc.url} />
                  </li>
                ))}
                {proyecto.documentos.length === 0 && <li className="text-gray-600">Sin documentos.</li>}
              </ul>

              {/* Uploaders SOLO una vez, fuera de la lista */}
              {(isOwner || isStaff) && (
                <div className="mt-4">
                  <Uploaders
                    proyectoId={proyecto.id}
                    estado={proyecto.estado}
                    isOwner={isOwner}
                    isStaff={!!isStaff}
                  />
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
