import { prisma } from '@/lib/prisma';
import EditForm from './EditForm';

export default async function EditProyecto({ params }: { params: { id: string } }) {
  const p = await prisma.proyecto.findUnique({ where: { id: params.id } });
  if (!p) return <main className="p-6">No existe</main>;

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Editar proyecto</h1>
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
    </main>
  );
}
