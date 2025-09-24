import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import VerPdfBtn from './VerPdfBtn';
import DeleteBtn from './DeleteBtn';

type Props = { params: Promise<{ id: string }> };

export default async function ProyectoDetail({ params }: Props) {
  const { id } = await params;

  const proyecto = await prisma.proyecto.findUnique({
    where: { id },
    include: { documentos: true },
  });

  if (!proyecto) return <main className="p-6">No existe</main>;

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <h1 className="text-2xl font-bold">{proyecto.titulo}</h1>
        <div className="flex gap-2">
          <Link className="border px-3 py-1 rounded" href={`/proyectos/${proyecto.id}/editar`}>Editar</Link>
          <DeleteBtn id={proyecto.id} />
        </div>
      </div>

      <div className="text-sm text-gray-600">
        Alumno: <span className="font-medium">{proyecto.alumnoNombre}</span> — Año: {proyecto.anio} — Fecha: {new Date(proyecto.fechaCarga).toISOString().slice(0,10)}
      </div>

      <h4 className="text-lg font-semibold mt-4">Descripción</h4>
      <p className="text-gray-700">{proyecto.descripcion}</p>

      <h4 className="text-lg font-semibold mt-4">Funcionalidades</h4>
      <ul className="list-disc list-inside text-gray-800">
        {proyecto.funcionalidades.map((f, i) => <li key={i}>{f}</li>)}
      </ul>

      <h2 className="text-lg font-semibold mt-6">Documentos</h2>
      <ul className="space-y-2">
        {proyecto.documentos.map((doc) => (
          <li key={doc.id} className="border p-2 rounded flex items-center justify-between">
            <div>
              <div>{doc.tipo} — v{doc.version} — {(doc.size/1024).toFixed(1)} KB</div>
              <div className="text-sm text-gray-600">{doc.mime}</div>
            </div>
            <VerPdfBtn keyS3={doc.url} />
          </li>
        ))}
        {proyecto.documentos.length === 0 && <li className="text-gray-600">Sin documentos.</li>}
      </ul>
    </main>
  );
}
