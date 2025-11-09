// src/app/usuarios/[id]/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import {
  ArrowLeft, User as UserIcon, Mail, IdCard, Phone, Shield,
  GraduationCap, CalendarCheck, Award, Folder, FolderX, FileText
} from 'lucide-react';

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`} >
      {children}
    </span>
  );
}

export default async function PerfilUsuarioPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  const viewerId = (session?.user as any)?.id as string | undefined;
  const viewerRole = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;

  if (!viewerId) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No autenticado
        </div>
      </main>
    );
  }

  // Autorización: ALUMNO solo puede ver su propio perfil
  const isStaff = viewerRole === 'ADMIN' || viewerRole === 'PROF';
  const canView = isStaff || id === viewerId;
  if (!canView) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No autorizado
        </div>
      </main>
    );
  }

  const u = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, nombre: true, email: true, dni: true, celular: true, role: true,
      egresado: true, fechaRindio: true, nota: true, requestedAt: true, approvedAt: true,
      proyectos: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, titulo: true, estado: true, isActive: true, fechaCarga: true },
      }
    }
  });

  if (!u) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          Usuario no encontrado
        </div>
      </main>
    );
  }

  const activos = u.proyectos.filter(p => p.isActive === true);
  const rechazados = u.proyectos.filter(p => p.isActive === false || p.estado === 'RECHAZADO');

  return (
    <main className="min-h-[calc(100vh-13.75rem)] px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 justify-between">
          <Link
            href={isStaff ? '/admin/usuarios' : '/mi-proyecto'}
            className="btn btn-ghost flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver
          </Link>
          <h1 className="text-2xl font-bold text-primary">Perfil de usuario</h1>
          <div className="w-16" />
        </div>

        {/* Card de info */}
        <section className="bg-white shadow-md rounded-lg p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <UserIcon className="h-5 w-5 text-blue-600 mt-1" />
              <div className="min-w-0">
                <div className="font-semibold break-words">{u.nombre}</div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> {u.role}
                  {u.egresado && <Badge className="bg-emerald-50 text-emerald-700">Egresado</Badge>}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Mail className="h-5 w-5 text-blue-600 mt-1" />
              <div className="min-w-0">
                <div className="font-semibold break-all">{u.email ?? '-'}</div>
                <div className="text-sm text-gray-600">Email</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <IdCard className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="font-semibold">{u.dni ?? '-'}</div>
                <div className="text-sm text-gray-600">DNI</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Phone className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="font-semibold">{u.celular ?? '-'}</div>
                <div className="text-sm text-gray-600">Celular</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CalendarCheck className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="font-semibold">
                  {u.fechaRindio ? new Date(u.fechaRindio).toLocaleDateString('es-AR') : '-'}
                </div>
                <div className="text-sm text-gray-600">Fecha rendida</div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Award className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <div className="font-semibold">{u.nota ?? '-'}</div>
                <div className="text-sm text-gray-600">Nota</div>
              </div>
            </div>
          </div>
        </section>

        {/* Proyectos activos */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Folder className="h-5 w-5 text-blue-700" />
            <h2 className="text-xl font-bold text-primary">Proyectos activos</h2>
          </div>

          {activos.length === 0 ? (
            <div className="text-gray-600 bg-white p-4 rounded-lg shadow-sm">Sin proyectos activos.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {activos.map(p => (
                <li key={p.id} className="bg-white rounded-lg shadow-sm p-4 border">
                  <div className="font-semibold text-blue-900 break-words">{p.titulo}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Badge className={
                      p.estado === 'APROBADO'
                        ? 'bg-green-100 text-green-700'
                        : p.estado === 'RECHAZADO'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }>
                      {p.estado}
                    </Badge>
                    <span>{new Date(p.fechaCarga).toLocaleDateString('es-AR')}</span>
                  </div>
                  <div className="mt-3">
                    <Link href={`/proyectos/${p.id}`} className="btn w-full justify-center">
                      Ver proyecto
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Proyectos rechazados */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FolderX className="h-5 w-5 text-rose-700" />
            <h2 className="text-xl font-bold text-primary">Rechazados</h2>
          </div>

          {rechazados.length === 0 ? (
            <div className="text-gray-600 bg-white p-4 rounded-lg shadow-sm">No tiene rechazados.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {rechazados.map(p => (
                <li key={p.id} className="bg-white rounded-lg shadow-sm p-4 border">
                  <div className="font-semibold text-blue-900 break-words">{p.titulo}</div>
                  <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-700">RECHAZADO</Badge>
                    <span>{new Date(p.fechaCarga).toLocaleDateString('es-AR')}</span>
                  </div>
                  <div className="mt-3">
                    <Link href={`/proyectos/${p.id}`} className="btn w-full justify-center">
                      Ver
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Nota visual */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <FileText className="h-4 w-4" /> La propuesta, PDF final y presentación se ven dentro de cada proyecto.
        </p>
      </div>
    </main>
  );
}
