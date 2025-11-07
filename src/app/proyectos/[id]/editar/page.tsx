import { prisma } from '@/lib/prisma';
import EditForm from './EditForm';
import Link from 'next/link';

export default async function EditProyecto({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  const p = await prisma.proyecto.findUnique({ where: { id } });
  if (!p) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <p>Proyecto no encontrado</p>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-13.75rem)] px-4 py-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
        <Link href={`/proyectos/${p.id}`} className="btn text-sm text-blue-600 ">
          &larr; Volver al proyecto
        </Link>
        <h1 className="text-2xl font-bold text-primary mt-3">Editar proyecto</h1>
        <EditForm proyecto={{
          id: p.id,
          titulo: p.titulo,
          descripcion: p.descripcion,
          funcionalidades: p.funcionalidades,
          alumnoNombre: p.alumnoNombre,
          alumnoEmail: p.alumnoEmail,
          anio: p.anio,
          fechaCarga: p.fechaCarga.toISOString().slice(0,10),
          estado: p.estado,
        }} />
      </div>
    </main>
  );
}
