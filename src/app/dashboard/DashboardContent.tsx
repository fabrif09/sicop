'use client';

import { useEffect, useState } from 'react';
import LogoutBtn from '../components/LogoutBtn';
import Link from 'next/link';


type Props = {
  email?: string | null;
  nombre?: string | null;
  rol?: string | null;
};

export default function DashboardContent({ email, nombre, rol }: Props) {
  // mostramos loader breve para dar la sensación de transición
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 300); // 300ms "fade in"
    return () => clearTimeout(t);
  }, []);

  const isAdmin = rol === 'ADMIN';
  const isProf = rol === 'PROF';
  const isAlumno = rol === 'ALUMNO';

  if (!ready) {
    // loader inline con la misma estética que tu loading.tsx
    return (
      <div
        className={`
          bg-white shadow-md rounded-lg p-6 w-full text-center space-y-3
          transform transition-all duration-300 ease-out
          opacity-100 translate-y-0
        `}
      >
        <h1 className="text-2xl font-bold text-primary">
          Cargando panel...
        </h1>

        <p className="text-gray-600 text-sm animate-pulse">
          Por favor esperá un momento
        </p>

        <div className="flex justify-center">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // contenido final
  return (
    <>
      {/* Datos de sesión */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-800">Datos de sesión</h2>
        <p>
          <span className="font-medium">Usuario:</span> {email}
        </p>
        <p>
          <span className="font-medium">Nombre:</span> {nombre}
        </p>
        <p>
          <span className="font-medium">Rol:</span> {rol}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {isAdmin && (
          <>
            <Link
              href="/materiales"
              className="btn w-full sm:w-auto text-center"
            >
              Material Cátedra
            </Link>
            <Link
              href="/proyectos"
              className="btn w-full sm:w-auto text-center"
            >
              Ver Proyectos
            </Link>
            <Link
              href="/admin/usuarios"
              className="btn w-full sm:w-auto text-center"
            >
              Lista Usuarios
            </Link>
            <Link
              href="/admin/alumnos"
              className="btn w-full sm:w-auto text-center"
            >
              Lista Alumnos
            </Link>
            <Link
              href="/admin/logs"
              className="btn w-full sm:w-auto text-center"
            >
              Ver Logs
            </Link>
          </>
        )}

        {isProf && !isAdmin && (
          <>
            <Link
              href="/materiales"
              className="btn w-full sm:w-auto text-center"
            >
              Material Cátedra
            </Link>
            <Link
              href="/proyectos"
              className="btn w-full sm:w-auto text-center"
            >
              Ver Proyectos
            </Link>
            <Link
              href="/admin/usuarios"
              className="btn w-full sm:w-auto text-center"
            >
              Lista Usuarios
            </Link>
            <Link
              href="/admin/alumnos"
              className="btn w-full sm:w-auto text-center"
            >
              Lista Alumnos
            </Link>
            <Link
              href="/admin/logs"
              className="btn w-full sm:w-auto text-center"
            >
              Ver Logs
            </Link>
          </>
        )}

        {isAlumno && (
          <>
            <Link
              href="/proyectos/nuevo"
              className="btn w-full sm:w-auto text-center"
            >
              Crear proyecto
            </Link>
            <Link
              href="/mi-proyecto"
              className="btn w-full sm:w-auto text-center"
            >
              Ver mi proyecto
            </Link>
            <LogoutBtn />
          </>
        )}
      </div>
    </>
  );
}
