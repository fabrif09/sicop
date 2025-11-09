import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Prisma, Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aprobarUsuario, crearUsuarioManual, rechazarUsuario } from './serverActions';
import { revalidatePath } from 'next/cache';
import EditUserModal from './EditUserModal';
import FiltrosUsuariosClient from './FiltrosUsuariosClient';
import CrearUsuarioClient from './CrearUsuarioClient';


/* ───────────────────────── Server Action: Guardar cambios ───────────────────────── */
export async function guardarDatosAlumno(formData: FormData) {
  'use server';

  const session = await getServerSession(authOptions);
  const viewerRole = (session?.user as any)?.role as Role | undefined;
  if (!viewerRole || !['ADMIN', 'PROF'].includes(viewerRole)) {
    throw new Error('No autorizado');
  }

  const id = String(formData.get('id') || '');
  if (!id) throw new Error('Falta id');

  const egresadoStr = String(formData.get('egresado') ?? '');
  const egresado = egresadoStr === 'on' || egresadoStr === 'true';

  const fechaStr = String(formData.get('fechaRindio') ?? '').trim();
  const fechaRindio = fechaStr ? new Date(fechaStr) : null;
  if (fechaRindio && Number.isNaN(fechaRindio.getTime())) {
    throw new Error('Fecha rendida inválida');
  }

  const notaStr = String(formData.get('nota') ?? '').trim();
  const nota = notaStr ? parseInt(notaStr, 10) : null;
  if (nota !== null && (Number.isNaN(nota) || nota < 0 || nota > 10)) {
    throw new Error('Nota inválida (0-10)');
  }

  const newRoleRaw = String(formData.get('role') ?? '').trim().toUpperCase();
  const canChangeRole =
    viewerRole === 'ADMIN' && ['ADMIN', 'PROF', 'ALUMNO'].includes(newRoleRaw);
  const roleUpdate: Partial<{ role: Role }> = canChangeRole
    ? { role: newRoleRaw as Role }
    : {};

  await prisma.user.update({
    where: { id },
    data: {
      egresado,
      fechaRindio: fechaRindio ?? null,
      nota: nota ?? null,
      ...roleUpdate,
    },
  });

  revalidatePath('/admin/usuarios');
}

/* ───────────────────────────────── Página ───────────────────────────────── */
type Search = {
  searchParams: Promise<{
    page?: string;
    nombre?: string;
    dni?: string;
    email?: string;
    celular?: string;
    rol?: string;
    egresado?: string;
    fechaRindio?: string;
    nota?: string;
    proyecto?: string;
  }>;
};

export default async function AdminUsuariosPage({ searchParams }: Search) {
  const session = await getServerSession(authOptions);
  const viewerRole = (session?.user as any)?.role as Role | undefined;

  if (!viewerRole || !['ADMIN', 'PROF'].includes(viewerRole)) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No autorizado.
        </div>
      </main>
    );
  }

  const sp = await searchParams;
  const page = Math.max(parseInt(sp?.page ?? '1', 10) || 1, 1);
  const perPage = 10;

  const fNombre = (sp?.nombre ?? '').trim();
  const fDni = (sp?.dni ?? '').trim();
  const fEmail = (sp?.email ?? '').trim();
  const fCelular = (sp?.celular ?? '').trim();
  const fRol = (sp?.rol ?? '').trim().toUpperCase();
  const fEgresado = (sp?.egresado ?? '').trim();
  const fFecha = (sp?.fechaRindio ?? '').trim();
  const fNota = (sp?.nota ?? '').trim();
  const fProyecto = (sp?.proyecto ?? '').trim();

  const pendientes = await prisma.user.findMany({
    where: { isActive: false },
    orderBy: { requestedAt: 'asc' },
    select: { id: true, email: true, nombre: true, requestedAt: true },
  });

  const whereAND: Prisma.UserWhereInput[] = [{ isActive: true }];
  if (fNombre)
    whereAND.push({
      nombre: { contains: fNombre, mode: 'insensitive' },
    });
  if (fDni)
    whereAND.push({
      dni: { contains: fDni, mode: 'insensitive' },
    });
  if (fEmail)
    whereAND.push({
      email: { contains: fEmail, mode: 'insensitive' },
    });
  if (fCelular)
    whereAND.push({
      celular: { contains: fCelular, mode: 'insensitive' },
    });
  if (fRol && ['ADMIN', 'PROF', 'ALUMNO'].includes(fRol))
    whereAND.push({ role: fRol as Role });
  if (fEgresado === 'true') whereAND.push({ egresado: true });
  if (fEgresado === 'false') whereAND.push({ egresado: false });

  if (fFecha) {
    const d = new Date(fFecha);
    if (!Number.isNaN(d.getTime())) {
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      whereAND.push({ fechaRindio: { gte: start, lte: end } });
    }
  }

  if (fNota) {
    const notaNum = parseInt(fNota, 10);
    if (!Number.isNaN(notaNum)) whereAND.push({ nota: notaNum as any });
  }

  if (fProyecto) {
    whereAND.push({
      proyectos: {
        some: { titulo: { contains: fProyecto, mode: 'insensitive' } },
      },
    });
  }

  const where: Prisma.UserWhereInput = { AND: whereAND };
  const total = await prisma.user.count({ where });

  const activos = await prisma.user.findMany({
    where,
    orderBy: { nombre: 'asc' },
    skip: (page - 1) * perPage,
    take: perPage,
    select: {
      id: true,
      nombre: true,
      dni: true,
      email: true,
      celular: true,
      role: true,
      egresado: true,
      fechaRindio: true,
      nota: true,
      proyectos: {
        where: { isActive: true },          // 👈 solo proyecto ACTIVO
        select: { id: true, titulo: true },
        take: 1,
      },
    },
  });


  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  return (
    <main className="px-4 py-6 space-y-8">
      {/* Pendientes */}
      <section className="space-y-3">
        <h1 className="text-2xl font-bold text-primary">Usuarios pendientes</h1>
        {pendientes.length === 0 ? (
          <div className="text-gray-600">No hay pendientes.</div>
        ) : (
          <ul className="space-y-2">
            {pendientes.map((u) => (
              <li
                key={u.id}
                className="border bg-white p-3 rounded-lg shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-medium">{u.nombre}</div>
                  <div className="text-sm text-gray-600">{u.email}</div>
                  <div className="text-xs text-gray-500">
                    Solicitado: {u.requestedAt.toISOString().slice(0, 10)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={aprobarUsuario}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="btn">Aprobar</button>
                  </form>
                  <form action={rechazarUsuario}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="btn bg-red-600 hover:bg-red-700">
                      Rechazar
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Activos */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-primary">Usuarios activos</h2>

        {/* Filtros (responsive con toggle en mobile) */}
        <FiltrosUsuariosClient
          defaults={{
            fNombre,
            fDni,
            fEmail,
            fCelular,
            fRol,
            fEgresado,
            fFecha,
            fNota,
            fProyecto,
            page,
          }}
        />

        {/* Crear usuario manualmente */}
        <CrearUsuarioClient viewerRole={viewerRole} />

        {/* Mobile / Cards (1 columna) */}
        <div className="space-y-3 md:hidden">
          {activos.length === 0 ? (
            <div className="text-gray-600">
              No hay usuarios activos con esos criterios.
            </div>
          ) : (
            activos.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-lg shadow-sm p-3 border"
              >
                <Link href={`/usuarios/${u.id}`} className="font-semibold text-primary hover:underline">
                  {u.nombre}
                </Link>
                <div className="text-sm font-bold">
                  DNI: <span className="text-gray-700">{u.dni ?? '-'}</span>
                </div>
                <div className="text-sm font-bold">
                  Email:{' '}
                  <span className="text-gray-700 break-all">{u.email}</span>
                </div>
                <div className="text-sm font-bold">
                  Celular:{' '}
                  <span className="text-gray-700">{u.celular ?? '-'}</span>
                </div>
                <div className="text-sm font-bold">
                  Rol:{' '}
                  <span className="text-gray-700">{u.role}</span>
                </div>
                <div className="text-sm font-bold">
                  Egresado:{' '}
                  <span className="text-gray-700">
                    {u.egresado ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="text-sm font-bold">
                  Fecha rendida:{' '}
                  <span className="text-gray-700">
                    {u.fechaRindio
                      ? u.fechaRindio.toISOString().slice(0, 10)
                      : '-'}
                  </span>
                </div>
                <div className="text-sm font-bold">
                  Nota:{' '}
                  <span className="text-gray-700">{u.nota ?? '-'}</span>
                </div>
                <div className="text-sm font-bold">
                  Proyecto:{' '}
                  {u.proyectos[0] ? (
                    <Link
                      href={`/proyectos/${u.proyectos[0].id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {u.proyectos[0].titulo || 'Ver proyecto'}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Sin proyecto</span>
                  )}
                </div>

                <div className="mt-3">
                  <EditUserModal
                    user={{
                      id: u.id,
                      egresado: u.egresado,
                      fechaRindio: u.fechaRindio,
                      nota: u.nota,
                      role: u.role,
                    }}
                    canEditRole={viewerRole === 'ADMIN'}
                    onSave={guardarDatosAlumno}
                    triggerClassName="w-full"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* ✅ Mediano (ventana dividida) — Cards en 2/3 columnas */}
        <div className="hidden md:grid lg:hidden gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activos.length === 0 ? (
            <div className="text-gray-600 md:col-span-2 xl:col-span-3">
              No hay usuarios activos con esos criterios.
            </div>
          ) : (
            activos.map((u) => (
              <div
                key={u.id}
                className="bg-white rounded-lg shadow-sm p-4 border"
              >
                <Link href={`/usuarios/${u.id}`} className="font-semibold text-primary hover:underline">
                  {u.nombre}
                </Link>
                <div className="text-sm">
                  <span className="font-semibold">DNI: </span>
                  <span className="text-gray-700">{u.dni ?? '-'}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Email: </span>
                  <span className="text-gray-700 break-all">{u.email}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Celular: </span>
                  <span className="text-gray-700">{u.celular ?? '-'}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Rol: </span>
                  <span className="text-gray-700">{u.role}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Egresado: </span>
                  <span className="text-gray-700">
                    {u.egresado ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Fecha rendida: </span>
                  <span className="text-gray-700">
                    {u.fechaRindio
                      ? u.fechaRindio.toISOString().slice(0, 10)
                      : '-'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Nota: </span>
                  <span className="text-gray-700">{u.nota ?? '-'}</span>
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Proyecto: </span>
                  {u.proyectos[0] ? (
                    <Link
                      href={`/proyectos/${u.proyectos[0].id}`}
                      className="text-blue-700 hover:underline"
                    >
                      {u.proyectos[0].titulo || 'Ver proyecto'}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Sin proyecto</span>
                  )}
                </div>

                <div className="mt-3">
                  <EditUserModal
                    user={{
                      id: u.id,
                      egresado: u.egresado,
                      fechaRindio: u.fechaRindio,
                      nota: u.nota,
                      role: u.role,
                    }}
                    canEditRole={viewerRole === 'ADMIN'}
                    onSave={guardarDatosAlumno}
                    triggerClassName="w-full"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop / Tabla */}
        <div className="hidden md:hidden md:block lg:block">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg text-sm">
            <thead>
              <tr className="bg-blue-50 text-left font-semibold text-blue-800">
                <th className="p-3">Nombre</th>
                <th className="p-3">DNI</th>
                <th className="p-3">Email</th>
                <th className="p-3">Celular</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Egresado</th>
                <th className="p-3">Fecha rendida</th>
                <th className="p-3">Nota</th>
                <th className="p-3">Proyecto</th>
                <th className="p-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {activos.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="p-4 text-center text-gray-500"
                  >
                    No hay usuarios activos con esos criterios.
                  </td>
                </tr>
              ) : (
                activos.map((u) => (
                  <tr key={u.id} className="border-t align-middle">
                    <td className="p-3 font-medium">
                      <Link href={`/usuarios/${u.id}`} className="text-blue-700 hover:underline">
                        {u.nombre}
                      </Link>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {u.dni ?? '-'}
                    </td>
                    <td className="p-3 break-all">{u.email}</td>
                    <td className="p-3 whitespace-nowrap">
                      {u.celular ?? '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap">{u.role}</td>
                    <td className="p-3 whitespace-nowrap">
                      {u.egresado ? 'Sí' : 'No'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {u.fechaRindio
                        ? new Date(u.fechaRindio).toLocaleDateString('es-AR')
                        : '-'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {u.nota ?? '-'}
                    </td>
                    <td className="p-3">
                      {u.proyectos[0] ? (
                        <Link
                          href={`/proyectos/${u.proyectos[0].id}`}
                          className="text-blue-700 hover:underline truncate inline-block max-w-[18rem]"
                          title={u.proyectos[0].titulo || 'Ver proyecto'}
                        >
                          {u.proyectos[0].titulo || 'Ver proyecto'}
                        </Link>
                      ) : (
                        <span className="text-gray-400">
                          Sin proyecto
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <EditUserModal
                        user={{
                          id: u.id,
                          egresado: u.egresado,
                          fechaRindio: u.fechaRindio,
                          nota: u.nota,
                          role: u.role,
                        }}
                        canEditRole={viewerRole === 'ADMIN'}
                        onSave={guardarDatosAlumno}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex justify-center gap-2">
            {page > 1 && (
              <Link
                href={`/admin/usuarios?page=${page - 1}`}
                className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
              >
                {'<-'} Anterior
              </Link>
            )}

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
              const params = new URLSearchParams({ page: String(n) });
              if (fNombre) params.set('nombre', fNombre);
              if (fDni) params.set('dni', fDni);
              if (fEmail) params.set('email', fEmail);
              if (fCelular) params.set('celular', fCelular);
              if (fRol) params.set('rol', fRol);
              if (fEgresado) params.set('egresado', fEgresado);
              if (fFecha) params.set('fechaRindio', fFecha);
              if (fNota) params.set('nota', fNota);
              if (fProyecto) params.set('proyecto', fProyecto);

              const active = n === page;
              return (
                <Link
                  key={n}
                  href={`/admin/usuarios?${params.toString()}`}
                  className={`px-3 py-1 border rounded ${
                    active
                      ? 'bg-primary text-white'
                      : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {n}
                </Link>
              );
            })}

            {page < totalPages && (
              <Link
                href={`/admin/usuarios?page=${page + 1}`}
                className="px-3 py-1 border rounded bg-white hover:bg-gray-100"
              >
                Siguiente {'->'}
              </Link>
            )}
          </div>

          <p className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </p>
        </div>
      </section>
    </main>
  );
}
