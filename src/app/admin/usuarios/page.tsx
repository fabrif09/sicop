import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Prisma } from '@prisma/client';
import { aprobarUsuario, rechazarUsuario } from './serverActions';

type Search = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function AdminUsuariosPage({ searchParams }: Search) {
  // 👇 Next 15: await antes de usar propiedades
  const sp = await searchParams;
  const q = (sp?.q ?? '').trim();
  const page = Math.max(parseInt(sp?.page ?? '1', 10) || 1, 1);
  const perPage = 10;

  // Pendientes
  const pendientes = await prisma.user.findMany({
    where: { isActive: false },
    orderBy: { requestedAt: 'asc' },
    select: { id: true, email: true, nombre: true, requestedAt: true },
  });

  // Activos (filtro + paginación)
  const where: Prisma.UserWhereInput = {
    isActive: true,
    ...(q
      ? {
          OR: [
            { nombre: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: q, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {}),
  };

  const total = await prisma.user.count({ where });

  const activos = await prisma.user.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
    select: {
      id: true,
      nombre: true,
      email: true,
      role: true,
      proyectos: { select: { id: true, titulo: true }, take: 1 },
    },
  });

  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  return (
    <main className="p-6 space-y-8">
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
                  {/* ✅ Server Actions en lugar de /api (evita 404) */}
                  <form action={aprobarUsuario}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="btn">Aprobar</button>
                  </form>
                  <form action={rechazarUsuario}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="btn bg-red-600 hover:bg-red-700">Rechazar</button>
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

        {/* Buscador */}
        <form action="/admin/usuarios" method="get" className="flex gap-2">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o email"
            className="border p-2 rounded w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          />
          <button type="submit" className="btn">Buscar</button>
        </form>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-sm rounded-lg">
            <thead>
              <tr className="bg-blue-50 text-left text-sm font-semibold text-blue-800">
                <th className="p-3">Nombre</th>
                <th className="p-3">Email</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Proyecto</th>
              </tr>
            </thead>
            <tbody>
              {activos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-gray-500">
                    No hay usuarios activos con esos criterios.
                  </td>
                </tr>
              ) : (
                activos.map((u) => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{u.nombre}</td>
                    <td className="p-3 text-gray-700">{u.email}</td>
                    <td className="p-3">{u.role}</td>
                    <td className="p-3">
                      {u.proyectos.length > 0 ? (
                        <Link
                          href={`/proyectos/${u.proyectos[0].id}`}
                          className="text-blue-600 hover:underline"
                        >
                          Ver proyecto
                        </Link>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin proyecto</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
            const href = `/admin/usuarios?page=${n}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
            const active = n === page;
            return (
              <Link
                key={n}
                href={href}
                className={`px-3 py-1 border rounded ${active ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                {n}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
