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
      aprobadoPor: { select: { nombre: true, email: true } },
      comentarios: {
        orderBy: { createdAt: 'desc' },
        include: { autor: { select: { nombre: true, email: true } } },
      },
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Link href="/proyectos" className="btn btn-ghost mb-2">
              ← Volver a Proyectos
            </Link>
            <h1 className="text-2xl font-bold text-primary break-words">{proyecto.titulo}</h1>

            {isStaff && (
              /*  en mobile, una columna y full-width; en desktop se acomodan */
              <div className="w-full sm:w-auto grid grid-cols-1 gap-2 text-center">
                <Link
                  className="btn w-full justify-center"
                  href={`/proyectos/${proyecto.id}/editar`}
                >
                  Editar
                </Link>
              </div>
            )}
          </div>

          {/* --- BLOQUE APROBAR/RECHAZAR --- */}
          {isStaff && proyecto.estado === 'PROPUESTO' && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {/* Aprobar con comentario (opcional) */}
              <form
                action={async (formData: FormData) => {
                  'use server';
                  const comentario = String(formData.get('comentario') || '');
                  const { aprobarProyecto } = await import('../actions');
                  await aprobarProyecto(proyecto.id, comentario);
                  revalidatePath(`/proyectos/${proyecto.id}`);
                }}
                className="flex flex-wrap items-center gap-2 w-full sm:w-auto"
              >
                <input
                  name="comentario"
                  className="border p-2 rounded flex-1 min-w-[180px]"
                  placeholder="Comentario (opcional)"
                />
                <button type="submit" className="btn bg-green-600 hover:bg-green-700 w-full sm:w-auto">
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
                className="flex flex-wrap items-center gap-2 w-full sm:w-auto"
              >
                <input
                  name="motivo"
                  className="border p-2 rounded flex-1 min-w-[180px]"
                  placeholder="Motivo (opcional)"
                />
                <button type="submit" className="btn bg-red-600 hover:bg-red-700 w-full sm:w-auto">
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
                    className="border p-3 rounded flex flex-wrap items-center justify-between hover:bg-gray-50 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium break-words">
                        {doc.tipo} — v{doc.version} — {(doc.size / 1024).toFixed(1)} KB
                      </div>
                      <div className="text-sm text-gray-600">{doc.mime}</div>
                    </div>
                    <div className="shrink-0">
                      <VerPdfBtn keyS3={doc.url} />
                    </div>
                  </li>
                ))}
                {proyecto.documentos.length === 0 && <li className="text-gray-600">Sin documentos.</li>}
              </ul>

              {/* Uploaders SOLO una vez, fuera de la lista */}
              {(isOwner || isStaff) && (
                <div className="mt-4">
                  {/*  Mobile: cada form del uploader en 1 columna (archivo arriba, botón abajo).
                      Desktop: dos columnas (archivo 1fr, botón auto). */}
                  <div
                    className="
                      [&_form]:grid
                      [&_form]:grid-cols-1
                      [&_form]:gap-2
                      sm:[&_form]:grid-cols-[1fr_auto]
                      [&_form_*[type='file']]:w-full
                      [&_form_*[type='file']]:max-w-full
                      [&_form_button[type='submit']]:w-full
                      sm:[&_form_button[type='submit']]:w-auto
                    "
                  >
                    <Uploaders
                      proyectoId={proyecto.id}
                      estado={proyecto.estado}
                      isOwner={isOwner}
                      isStaff={!!isStaff}
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="mt-6">
              <h4 className="text-lg font-semibold">Comentarios de Profesores</h4>

              {/*  Form para que STAFF agregue comentarios */}
              {isStaff && (
                <form
                  action={async (formData: FormData) => {
                    'use server';
                    const session = await getServerSession(authOptions);
                    const autorId = (session?.user as any)?.id as string | undefined;
                    const texto = String(formData.get('texto') || '').trim();
                    const tipo = String(formData.get('tipo') || 'FEEDBACK');

                    if (!autorId) throw new Error('No autenticado');
                    if (!texto) return; // no guardamos vacíos

                    await prisma.proyectoComentario.create({
                      data: {
                        proyectoId: proyecto.id,
                        autorId,
                        tipo: tipo as any, // 'GENERAL' | 'APROBACION' | 'RECHAZO'
                        texto,
                      },
                    });

                    revalidatePath(`/proyectos/${proyecto.id}`);
                  }}
                  className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[160px,1fr,auto]"
                >
                  <select
                    name="tipo"
                    className="border rounded p-2"
                    defaultValue="FEEDBACK"
                  >
                    <option value="FEEDBACK">FEEDBACK</option>
                    <option value="APROBACION">APROBACION</option>
                    <option value="RECHAZO">RECHAZO</option>
                  </select>

                  <textarea
                    name="texto"
                    className="border rounded p-2 min-h-[72px] resize-y"
                    placeholder="Escribí tu comentario para el alumno…"
                  />

                  <button type="submit" className="btn w-full sm:w-auto">
                    Agregar comentario
                  </button>
                </form>
              )}

              {proyecto.comentarios.length === 0 ? (
                <p className="text-gray-600 mt-3">Sin comentarios.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {proyecto.comentarios.map((c) => (
                    <li key={c.id} className="border p-3 rounded bg-white">
                      <div className="text-sm text-gray-600">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                            c.tipo === 'APROBACION'
                              ? 'bg-green-100 text-green-700'
                              : c.tipo === 'RECHAZO'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {c.tipo}
                        </span>
                        {c.autor?.nombre ? c.autor.nombre : 'Staff'}
                        {' — '}
                        {new Date(c.createdAt).toLocaleString('es-AR')}
                      </div>
                      <p className="mt-1 text-gray-800 whitespace-pre-line break-words text-wrap">
                        {c.texto}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
