// src/app/proyectos/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import VerPdfBtn from './VerPdfBtn';
import Link from 'next/link';
import DeleteBtn from './DeleteBtn';

export default async function ProyectoDetail({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;

  if (!userId) {
    return <main className="p-6">No autenticado</main>;
  }

  const proyecto = await prisma.proyecto.findUnique({
    where: { id: params.id },
    include: { documentos: true },
  });

  if (!proyecto) return <main className="p-6">No existe</main>;

  const isOwner = proyecto.ownerId === userId;
  const isStaff = role === 'ADMIN' || role === 'PROF';

  if (!(isOwner || isStaff)) {
    return (
      <main className="p-6">
        <h1 className="text-xl font-semibold">No autorizado</h1>
        <p className="text-gray-600">No podés ver proyectos de otros alumnos.</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{proyecto.titulo}</h1>

      {isStaff && (
        <div className="flex items-center gap-2">
          <Link className="border px-3 py-1 rounded" href={`/proyectos/${proyecto.id}/editar`}>Editar</Link>
          <DeleteBtn id={proyecto.id} />
        </div>
      )}

      <h4 className="text-lg font-semibold">Descripción</h4>
      <p className="text-gray-700">{proyecto.descripcion}</p>

      <h4 className="text-lg font-semibold">Funcionalidades</h4>
      <ul className="list-disc list-inside text-gray-800">
        {proyecto.funcionalidades.map((f, i) => <li key={i}>{f}</li>)}
      </ul>

      <h2 className="text-lg font-semibold">Documento</h2>
      <ul className="space-y-2">
        {proyecto.documentos.map(doc => (
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
