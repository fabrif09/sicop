import { prisma } from '@/lib/prisma';
import EditForm from './EditForm';

export default async function EditProyecto({ params }: { params: { id: string } }) {
  const p = await prisma.proyecto.findUnique({ where: { id: params.id } });
  if (!p) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No existe
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-13.75rem)] px-4 py-6">
      <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-primary">Editar proyecto</h1>
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
