import { prisma } from '@/lib/prisma';
import VerPdfBtn from './verPdfBtn';
//import Uploader from './uploader';

export default async function ProyectoDetail({ params }: { params: { id: string } }) {
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: params.id },
    include: { documentos: true },
  });
  if (!proyecto) return <main className="p-6">No existe</main>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">{proyecto.titulo}</h1>
      <h4 className="text-lg font-semibold">Descripción</h4>
      <p className="text-gray-700">{proyecto.descripcion}</p>
      <h4 className="text-lg font-semibold">Funcionalidades</h4>
      <ul className="list-disc list-inside text-gray-800">
        {proyecto.funcionalidades.map((f, i) => <li key={i}>{f}</li>)}
      </ul>

      {/*<Uploader proyectoId={proyecto.id} />*/}

      <h2 className="text-lg font-semibold">Documentos</h2>
      <ul className="space-y-2">
        {proyecto.documentos.map(doc => (
          <li key={doc.id} className="border p-2 rounded">
            <div>{doc.tipo} — v{doc.version} — {(doc.size/1024).toFixed(1)} KB</div>
            <div className="text-sm text-gray-600">{doc.mime}</div>
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
            </ul>
          </li>
        ))}
      </ul>
    </main>
  );
}
