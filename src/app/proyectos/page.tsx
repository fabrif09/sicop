import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { buildTextoIndexado } from '@/lib/textoIndexado';

type Search = { searchParams: Promise<{ anio?: string; q?: string; umbral?: string; page?: string }> };

export default async function ProyectosPage({ searchParams }: Search) {
  //  doble chequeo (además del middleware)
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;

  if (!role || !['ADMIN', 'PROF'].includes(role)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center space-y-2">
          <h1 className="text-xl font-bold text-primary">No autorizado</h1>
          <p className="text-gray-600">Esta sección es solo para la cátedra.</p>
        </div>
      </main>
    );
  }

  const sp = await searchParams;
  const anio = sp?.anio ? Number(sp.anio) : undefined;
  const q = (sp?.q ?? '').trim();
  const umbral = sp?.umbral ? Number(sp.umbral) : 0.30;
  const page = Math.max(parseInt(sp?.page ?? '1', 10) || 1, 1);
  const perPage = 10;
  const offset = (page - 1) * perPage;

  type Row = { id: string; titulo: string; alumnoNombre: string; fechaCarga: Date; anio: number; score?: number };

  // 🔹 Proyectos pendientes (arriba de todo)
  const pendientes = await prisma.proyecto.findMany({
    where: { estado: 'PROPUESTO' as any },
    orderBy: { createdAt: 'asc' },
    select: { id: true, titulo: true, alumnoNombre: true, fechaCarga: true },
  });

  let proyectos: Row[] = [];
  let total = 0;

  if (q) {
    // 🔎 Búsqueda con trigram + ILIKE, paginada — solo APROBADOS
    const texto = buildTextoIndexado(q, '', []);

    // total
    const countRows = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM "Proyecto" AS p
      WHERE p."estado" = 'APROBADO'
        AND (
          (p."textoIndexado" % ${texto} AND similarity(p."textoIndexado", ${texto}) >= ${umbral})
          OR (p."titulo" ILIKE ${'%' + q + '%'})
        )
    `;
    total = countRows[0]?.count ?? 0;

    // página
    proyectos = await prisma.$queryRaw<Row[]>`
      SELECT p.id, p.titulo, p."alumnoNombre", p."fechaCarga", p."anio",
             similarity(p."textoIndexado", ${texto}) AS score
      FROM "Proyecto" AS p
      WHERE p."estado" = 'APROBADO'
        AND (
          (p."textoIndexado" % ${texto} AND similarity(p."textoIndexado", ${texto}) >= ${umbral})
          OR (p."titulo" ILIKE ${'%' + q + '%'})
        )
      ORDER BY score DESC NULLS LAST, p."createdAt" DESC
      LIMIT ${perPage} OFFSET ${offset};
    `;
  } else {
    // 📄 Listado simple por año (si lo pasan), paginado — solo APROBADOS
    const where = Number.isFinite(anio)
      ? { anio, estado: 'APROBADO' as any }
      : { estado: 'APROBADO' as any };

    total = await prisma.proyecto.count({ where });
    proyectos = await prisma.proyecto.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, titulo: true, alumnoNombre: true, fechaCarga: true, anio: true },
      skip: offset,
      take: perPage,
    });
  }

  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  function pageHref(n: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (Number.isFinite(anio)) params.set('anio', String(anio));
    if (q && sp?.umbral) params.set('umbral', String(umbral));
    params.set('page', String(n));
    const qs = params.toString();
    return `/proyectos${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="min-h-[calc(100vh-13.75rem)] px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header + CTA */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">Proyectos</h1>
        </div>

        {/* 🔹 Proyectos pendientes de aprobación (solo Ver) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Proyectos pendientes</h2>
          {pendientes.length === 0 ? (
            <div className="text-gray-600">No hay proyectos pendientes.</div>
          ) : (
            <ul className="space-y-2">
              {pendientes.map((p) => (
                <li
                  key={p.id}
                  className="border bg-white p-3 rounded-lg shadow-sm flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium">
                      <Link href={`/proyectos/${p.id}`} className="text-blue-700 hover:underline">
                        {p.titulo}
                      </Link>
                    </div>
                    <div className="text-sm text-gray-600">
                      Alumno: {p.alumnoNombre}
                    </div>
                    <div className="text-xs text-gray-500">
                      Cargado: {new Date(p.fechaCarga).toISOString().slice(0, 10)}
                    </div>
                  </div>
                  <Link href={`/proyectos/${p.id}`} className="btn">
                    Ver
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Filtros */}
        <div className="bg-white shadow-sm rounded-lg p-4">
          <form className="flex flex-wrap items-end gap-3" action="/proyectos" method="get">
            <div className="flex-1 min-w-[260px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
              <input
                className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                name="q"
                placeholder="Ej: sistema turnos gimnasio"
                defaultValue={q}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
              <input
                className="border border-gray-300 rounded w-28 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                name="anio"
                type="number"
                placeholder="Año"
                defaultValue={Number.isFinite(anio) ? anio : ''}
              />
            </div>

            {q && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Umbral</label>
                <input
                  className="border border-gray-300 rounded w-24 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                  name="umbral"
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="0.9"
                  defaultValue={umbral}
                />
              </div>
            )}

            <button className="btn" type="submit">Buscar</button>
            {(q || Number.isFinite(anio)) && (
              <Link className="text-primary hover:underline" href="/proyectos">Limpiar</Link>
            )}
          </form>
        </div>

        {/* Resultados (solo APROBADOS) */}
        <div className="bg-white shadow-sm rounded-lg">
          <ul className="divide-y">
            {proyectos.map((p) => (
              <li key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <Link className="font-medium text-blue-700 hover:underline" href={`/proyectos/${p.id}`}>
                    {p.titulo}
                  </Link>
                  <div className="text-sm text-gray-600 mt-1">
                    Alumno: {p.alumnoNombre} — Año: {p.anio} — Fecha:{' '}
                    {new Date(p.fechaCarga).toISOString().slice(0, 10)}
                    {typeof (p as any).score === 'number' && (
                      <> — Score: {(p as any).score.toFixed(2)}</>
                    )}
                  </div>
                </div>
                <Link className="text-sm text-blue-700 hover:underline" href={`/proyectos/${p.id}`}>
                  Ver
                </Link>
              </li>
            ))}

            {proyectos.length === 0 && (
              <li className="p-4 text-gray-600">Sin resultados.</li>
            )}
          </ul>
        </div>

        {/* Paginación */}
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
            const active = n === page;
            return (
              <Link
                key={n}
                href={pageHref(n)}
                className={`px-3 py-1 border rounded ${active ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}`}
              >
                {n}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
