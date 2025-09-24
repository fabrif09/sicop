import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { buscarProyectos } from './actions';

type Search = { searchParams: Promise<{ anio?: string; q?: string; umbral?: string }> };

export default async function ProyectosPage({ searchParams }: Search) {
  const sp = await searchParams;
  const anio = sp?.anio ? Number(sp.anio) : undefined;
  const q = (sp?.q ?? '').trim();
  const umbral = sp?.umbral ? Number(sp.umbral) : undefined;

  let proyectos:
    | { id: string; titulo: string; alumnoNombre: string; fechaCarga: Date; anio: number; score?: number }[]
    = [];

  if (q) {
    proyectos = await buscarProyectos({ q, umbral: umbral ?? 0.30, limit: 50 });
  } else {
    proyectos = await prisma.proyecto.findMany({
      where: Number.isFinite(anio) ? { anio } : {},
      orderBy: { createdAt: 'desc' },
      select: { id: true, titulo: true, alumnoNombre: true, fechaCarga: true, anio: true },
      take: 50,
    });
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Link className="underline" href="/proyectos/nuevo">Nuevo proyecto</Link>
      </div>

      {/* Filtros */}
      <form className="flex flex-wrap items-center gap-2" action="/proyectos" method="get">
        <input
          className="border p-2 w-[22rem] max-w-full"
          name="q"
          placeholder="Buscar (ej: sistema turnos gimnasio)"
          defaultValue={q}
        />
        <input
          className="border p-2 w-28"
          name="anio"
          type="number"
          placeholder="Año"
          defaultValue={Number.isFinite(anio) ? anio : ''}
        />
        {/* Umbral visible solo si hay búsqueda */}
        {q && (
          <label className="text-sm text-gray-600 flex items-center gap-2">
            Umbral
            <input
              className="border p-1 w-20"
              name="umbral"
              type="number"
              step="0.05"
              min="0.1"
              max="0.9"
              defaultValue={umbral ?? 0.30}
            />
          </label>
        )}
        <button className="border px-3 py-1 rounded" type="submit">Buscar</button>
        {(q || Number.isFinite(anio)) && (
          <Link className="underline ml-2" href="/proyectos">Limpiar</Link>
        )}
      </form>

      {/* Resultados */}
      <ul className="space-y-2">
        {proyectos.map((p) => (
          <li key={p.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <Link className="font-medium underline" href={`/proyectos/${p.id}`}>{p.titulo}</Link>
              <div className="text-sm text-gray-600">
                Alumno: {p.alumnoNombre} — Año: {p.anio} — Fecha: {new Date(p.fechaCarga).toISOString().slice(0,10)}
                {typeof (p as any).score === 'number' && (
                  <> — Score: {(p as any).score.toFixed(2)}</>
                )}
              </div>
            </div>
            <Link className="text-sm underline" href={`/proyectos/${p.id}`}>Ver</Link>
          </li>
        ))}
        {proyectos.length === 0 && <li className="text-gray-600">Sin resultados.</li>}
      </ul>
    </main>
  );
}
