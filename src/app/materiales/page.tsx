//src/app/materiales/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listarMateriales, borrarMaterial } from '@/app/api/materiales/actions';
import MaterialUploader from './MaterialUploader';
import VerArchivoBtn from './VerArchivoBtn';
import ConfirmDeleteMaterialBtn from './ConfirmDeleteMaterialBtn';


export default async function MaterialesPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN'|'PROF'|'ALUMNO'|undefined;
  const isStaff = role === 'ADMIN' || role === 'PROF';

  const materiales = await listarMateriales();

  return (
    <main className="min-h-[calc(100vh-13.75rem)] bg-gray-50 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header responsive: columna en mobile / fila en desktop */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-primary">Documentos de cátedra</h1>
          {isStaff && <MaterialUploader />}
        </div>

        <div className="bg-white shadow-sm rounded-lg">
          <ul className="divide-y">
            {materiales.map((m) => (
              <li
                key={m.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 hover:bg-gray-50"
              >
                {/* Columna izquierda: textos, permitimos cortes en mobile */}
                <div className="min-w-0 break-words">
                  <div className="font-medium">
                    {m.titulo}
                    {m.version > 1 && (
                      <span className="ml-2 text-xs text-gray-500">v{m.version}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {m.categoria ? `${m.categoria} — ` : ''}
                    {m.descripcion || 'Sin descripción'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {m.mime} — {(m.size / 1024).toFixed(0)} KB —{' '}
                    {new Date(m.createdAt).toLocaleDateString('es-AR')}
                  </div>
                </div>

                {/* Columna derecha: acciones. En mobile, grilla 2 columnas; en desktop, fila */}
                <div className="w-full sm:w-auto grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 sm:shrink-0">
                  {/* Ver */}
                  <div className="col-span-1">
                    <VerArchivoBtn keyS3={m.key} />
                  </div>

                  {/* Reemplazar (solo staff) */}
                  {isStaff && (
                    <div className="col-span-1">
                      <MaterialUploader replaceId={m.id} replaceLabel="Reemplazar" />
                    </div>
                  )}

                  {/* Borrar (solo staff) */}
                  {isStaff && (
                    <div className="col-span-2 sm:col-span-1">
                      <form
                        action={async () => {
                          'use server';
                          await borrarMaterial(m.id);
                        }}
                      >
                        <ConfirmDeleteMaterialBtn> Borrar </ConfirmDeleteMaterialBtn>
                      </form>
                    </div>
                  )}
                </div>
              </li>
            ))}

            {materiales.length === 0 && (
              <li className="p-4 text-gray-600">Aún no hay documentos.</li>
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
