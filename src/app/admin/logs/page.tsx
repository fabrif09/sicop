// src/app/admin/logs/page.tsx
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditAction, Prisma } from '@prisma/client';
import { FiltersForm } from './FiltersForm';

type Search = {
  searchParams: Promise<{
    page?: string;
    action?: string;
    user?: string;
    target?: string;
    proyecto?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function AdminLogsPage({ searchParams }: Search) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;
  if (!role || !['ADMIN','PROF'].includes(role)) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 text-center">
          No autorizado
        </div>
      </main>
    );
  }

  const sp = await searchParams;
  const page = Math.max(parseInt(sp?.page ?? '1', 10) || 1, 1);
  const perPage = 20;

  const action = (sp?.action ?? '').trim().toUpperCase();
  const userQuery = (sp?.user ?? '').trim();
  const targetQuery = (sp?.target ?? '').trim();
  const proyectoQuery = (sp?.proyecto ?? '').trim();
  const from = sp?.from ? new Date(sp.from) : undefined;
  const to = sp?.to ? new Date(sp.to) : undefined;

  const and: Prisma.AuditLogWhereInput[] = [];

  if (action && Object.keys(AuditAction).includes(action)) {
    and.push({ action: action as AuditAction });
  }
  if (from || to) {
    and.push({
      createdAt: {
        gte: from ?? undefined,
        lte: to ? new Date(new Date(to).setHours(23,59,59,999)) : undefined,
      }
    });
  }
  if (userQuery) {
    and.push({
      OR: [
        { user: { nombre: { contains: userQuery, mode: 'insensitive' } } },
        { user: { email: { contains: userQuery, mode: 'insensitive' } } },
      ],
    });
  }
  if (targetQuery) {
    and.push({
      OR: [
        { targetUser: { nombre: { contains: targetQuery, mode: 'insensitive' } } },
        { targetUser: { email: { contains: targetQuery, mode: 'insensitive' } } },
        { targetUserId: { equals: targetQuery } },
      ],
    });
  }
  if (proyectoQuery) {
    and.push({
      OR: [
        { proyecto: { id: { equals: proyectoQuery } } },
        { proyecto: { titulo: { contains: proyectoQuery, mode: 'insensitive' } } },
      ],
    });
  }

  const where: Prisma.AuditLogWhereInput = and.length ? { AND: and } : {};

  const total = await prisma.auditLog.count({ where });
  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
    select: {
      id: true,
      action: true,
      createdAt: true,
      user: { select: { id: true, nombre: true, email: true } },
      targetUser: { select: { id: true, nombre: true, email: true } },
      proyecto: { select: { id: true, titulo: true } },
      metadata: true,
    },
  });

  const totalPages = Math.max(Math.ceil(total / perPage), 1);

  return (
    <main className="px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold text-primary">Auditoría</h1>

      {/* Filtros: grilla fluida responsive */}
      <FiltersForm
        initial={{
            action,
            user: userQuery,
            target: targetQuery,
            proyecto: proyectoQuery,
            from: sp?.from ?? '',
            to: sp?.to ?? '',
        }}
       />

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-50 text-blue-800 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left">Fecha</th>
              <th className="p-2 text-left">Acción</th>
              <th className="p-2 text-left">Usuario</th>
              <th className="p-2 text-left hidden md:table-cell">Target</th>
              <th className="p-2 text-left hidden lg:table-cell">Proyecto</th>
              <th className="p-2 text-left hidden xl:table-cell">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">Sin resultados.</td>
              </tr>
            ) : logs.map(l => (
              <tr key={l.id} className="border-t hover:bg-gray-50/60">
                <td className="p-2 whitespace-nowrap">
                  {new Date(l.createdAt).toLocaleString('es-AR')}
                </td>
                <td className="p-2">{l.action}</td>
                <td className="p-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.user?.nombre || '(sin nombre)'}</div>
                    <div className="text-gray-500 text-xs break-words">{l.user?.email}</div>
                  </div>
                </td>

                {/* Target: oculto en xs */}
                <td className="p-2 hidden md:table-cell">
                  {l.targetUser ? (
                    <div className="min-w-0">
                      <div className="font-medium truncate">{l.targetUser.nombre || '(sin nombre)'}</div>
                      <div className="text-gray-500 text-xs break-words">{l.targetUser.email}</div>
                    </div>
                  ) : '—'}
                </td>

                {/* Proyecto: oculto hasta lg */}
                <td className="p-2 hidden lg:table-cell">
                  {l.proyecto ? (
                    <div className="min-w-0">
                      <div className="font-medium break-words">{l.proyecto.titulo}</div>
                      <div className="text-gray-500 text-xs break-all">{l.proyecto.id}</div>
                    </div>
                  ) : '—'}
                </td>

                {/* Metadata: colapsable en mobile */}
                <td className="p-2 align-top hidden xl:table-cell">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(l.metadata ?? {}, null, 2)}
                  </pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Bloque alternativo para metadata en pantallas chicas */}
        {logs.length > 0 && (
          <div className="xl:hidden border-t p-3">
            <details className="group">
              <summary className="cursor-pointer text-sm text-blue-700 hover:underline">
                Ver metadata (modo compacto)
              </summary>
              <div className="mt-2 space-y-2">
                {logs.map(l => (
                  <div key={l.id} className="rounded border p-2 bg-white">
                    <div className="text-xs text-gray-500">{new Date(l.createdAt).toLocaleString('es-AR')}</div>
                    <pre className="text-xs whitespace-pre-wrap break-words mt-1">
                      {JSON.stringify(l.metadata ?? {}, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Paginación */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => {
          const params = new URLSearchParams({ page: String(n) });
          if (action) params.set('action', action);
          if (userQuery) params.set('user', userQuery);
          if (targetQuery) params.set('target', targetQuery);
          if (proyectoQuery) params.set('proyecto', proyectoQuery);
          if (sp?.from) params.set('from', sp.from);
          if (sp?.to) params.set('to', sp.to);

          const active = n === page;
          return (
            <a
              key={n}
              href={`/admin/logs?${params.toString()}`}
              className={`px-3 py-1.5 border rounded transition-colors
                ${active ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-gray-100'}`}
            >
              {n}
            </a>
          );
        })}
      </div>
    </main>
  );
}
