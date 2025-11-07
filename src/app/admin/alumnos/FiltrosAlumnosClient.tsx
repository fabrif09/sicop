'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FiltrosAlumnosClient({
  defaults,
}: {
  defaults: {
    fNombre: string;
    fDni: string;
    fEmail: string;
    fCelular: string;
    fEgresado: string;
    fFecha: string;
    fNota: string;
    fProyecto: string;
    page: number;
  };
}) {
  const {
    fNombre,
    fDni,
    fEmail,
    fCelular,
    fEgresado,
    fFecha,
    fNota,
    fProyecto,
    page,
  } = defaults;

  // mobile hidden por defecto
  const [openMobile, setOpenMobile] = useState(false);

  // misma idea: forzar remount cuando se limpian filtros
  const formKey = [
    fNombre,
    fDni,
    fEmail,
    fCelular,
    fEgresado,
    fFecha,
    fNota,
    fProyecto,
    page,
  ].join('|');

  return (
    <div className="space-y-3">
      {/* Botón toggle en mobile */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile((s) => !s)}
          className="btn w-full flex items-center justify-center"
        >
          {openMobile ? 'Ocultar filtros' : 'Filtros'}
        </button>
      </div>

      {/* Formulario de filtros:
          - en mobile: se muestra solo si openMobile === true
          - en desktop: siempre visible */}
      <form
        action="/admin/alumnos"
        method="get"
        key={formKey}
        className={`
          bg-white p-4 rounded-lg shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3
          ${openMobile ? 'block' : 'hidden md:grid'}
        `}
      >
        <input
          name="nombre"
          defaultValue={fNombre}
          placeholder="Nombre"
          className="border bg-gray-50 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
        />
        <input
          name="dni"
          defaultValue={fDni}
          placeholder="DNI"
          className="border bg-gray-50 p-2 rounded"
        />
        <input
          name="email"
          defaultValue={fEmail}
          placeholder="Email"
          className="border bg-gray-50 p-2 rounded"
        />
        <input
          name="celular"
          defaultValue={fCelular}
          placeholder="Celular"
          className="border bg-gray-50 p-2 rounded"
        />
        <select
          name="egresado"
          defaultValue={fEgresado}
          className="border bg-gray-50 p-2 rounded"
        >
          <option value="">Egresado (todos)</option>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
        <input
          name="fechaRindio"
          type="date"
          defaultValue={fFecha}
          className="border bg-gray-50 p-2 rounded"
        />
        <input
          name="nota"
          defaultValue={fNota}
          placeholder="Nota (0-10)"
          className="border bg-gray-50 p-2 rounded"
        />
        <input
          name="proyecto"
          defaultValue={fProyecto}
          placeholder="Proyecto (título)"
          className="border bg-gray-50 p-2 rounded"
        />

        <div className="flex items-center gap-2 col-span-full">
          <button type="submit" className="btn">
            Filtrar
          </button>
          <Link
            href="/admin/alumnos"
            replace
            prefetch={false}
            className="text-primary hover:underline"
          >
            Limpiar
          </Link>
        </div>
      </form>
    </div>
  );
}
