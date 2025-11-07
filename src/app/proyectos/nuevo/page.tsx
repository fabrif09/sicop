// src/app/proyectos/nuevo/page.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import NuevoProyectoForm from './NuevoProyectoForm';

export default async function NuevoProyectoPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) redirect('/login');

  // Traigo user con id y role (fallback seguro si la session no trae id/role)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!user) redirect('/login');

  // Solo ALUMNO puede crear
  if (user.role !== 'ALUMNO') {
    // podés mandarlo al dashboard si preferís
    redirect('/');
  }

  // ¿Ya tiene proyecto?
  const yaTiene = await prisma.proyecto.count({ where: { ownerId: user.id } });
  if (yaTiene > 0) {
    // redirige con mensaje (lo leemos en /mi-proyecto)
    redirect('/mi-proyecto?m=ya_tenes_proyecto');
  }

  // Renderiza el form (client component) con la estética que venimos usando
  return (
    <main className="p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-center text-primary">Nuevo Proyecto</h1>
      <NuevoProyectoForm />
    </main>
  );
}
