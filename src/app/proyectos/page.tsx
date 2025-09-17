import { prisma } from '@/lib/prisma';
import Link from 'next/link';

type Search = { searchParams: Promise<{ anio?: string }> };

export default async function ProyectosPage({ searchParams }: Search) {
  const sp = await searchParams; // 👈 importante
  const anio = sp?.anio ? Number(sp.anio) : undefined;

  const proyectos = await prisma.proyecto.findMany({
    where: Number.isFinite(anio) ? { anio } : {},
    orderBy: { createdAt: 'desc' },
    select: { id: true, titulo: true, alumnoNombre: true, fechaCarga: true, anio: true },
    take: 50,
  });

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <Link className="underline" href="/proyectos/nuevo">Nuevo proyecto</Link>
      </div>

      <form className="flex items-center gap-2" action="/proyectos" method="get">
        <input
          className="border p-2 w-32"
          name="anio"
          type="number"
          placeholder="Año"
          defaultValue={Number.isFinite(anio) ? anio : ''}
        />
        <button className="border px-3 py-1 rounded" type="submit">Filtrar</button>
        {Number.isFinite(anio) && <Link className="underline ml-2" href="/proyectos">Limpiar</Link>}
      </form>

      <ul className="space-y-2">
        {proyectos.map(p => (
          <li key={p.id} className="border rounded p-3 flex items-center justify-between">
            <div>
              <Link className="font-medium underline" href={`/proyectos/${p.id}`}>{p.titulo}</Link>
              <div className="text-sm text-gray-600">
                Alumno: {p.alumnoNombre} — Año: {p.anio} — Fecha: {new Date(p.fechaCarga).toISOString().slice(0,10)}
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