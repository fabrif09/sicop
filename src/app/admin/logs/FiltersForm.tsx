// FiltersForm.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AuditAction } from '@prisma/client';
import { useRef } from 'react';

export function FiltersForm({
  initial,
}: {
  initial: {
    action: string;
    user: string;
    target: string;
    proyecto: string;
    from?: string;
    to?: string;
  };
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action="/admin/logs"
      method="GET"
      className="
        bg-white rounded-lg shadow-sm p-3
        grid gap-2
        [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]
      "
      // Este key fuerza un rerender limpio cuando cambian los filtros (opcional)
      key={sp?.toString()}
    >
      <select
        name="action"
        defaultValue={initial.action}
        className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
      >
        <option value="">Todas las acciones</option>
        {Object.keys(AuditAction).map((key) => (
          <option key={key} value={key}>{key}</option>
        ))}
      </select>

      <input
        name="user"
        placeholder="Usuario (nombre/email)"
        className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        defaultValue={initial.user}
      />
      <input
        name="target"
        placeholder="Target (id/nombre/email)"
        className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        defaultValue={initial.target}
      />
      <input
        name="proyecto"
        placeholder="Proyecto (id/título)"
        className="border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        defaultValue={initial.proyecto}
      />

      {/* Fechas: responsive + labels visibles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="flex flex-col">
            <label htmlFor="from" className="text-sm text-gray-600 mb-1">Desde</label>
            <input
            type="date"
            name="from"
            id="from"
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            defaultValue={initial.from ?? ''}
            />
        </div>

        <div className="flex flex-col">
            <label htmlFor="to" className="text-sm text-gray-600 mb-1">Hasta</label>
            <input
            type="date"
            name="to"
            id="to"
            className="border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            defaultValue={initial.to ?? ''}
            />
        </div>
      </div>

      <div className="col-span-full flex items-center gap-2 justify-end">
        <button className="btn" type="submit">Filtrar</button>

        {/* 🔹 Limpiar: resetea inputs/selects y limpia la URL */}
        <button
          type="button"
          className="text-primary hover:underline px-2 py-1"
          onClick={() => {
            formRef.current?.reset();          // limpia todos los inputs/selects
            router.replace('/admin/logs');     // quita query params y recarga el SSR
          }}
        >
          Limpiar
        </button>
      </div>
    </form>
  );
}
