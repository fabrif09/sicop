// src/app/admin/usuarios/EditUserModal.tsx
'use client';

import { useRef } from 'react';
import type { Role } from '@prisma/client';
import { Pencil } from 'lucide-react';

type UserForModal = {
  id: string;
  nombre?: string | null;
  email?: string | null;
  celular?: string | null;
  egresado: boolean | null;
  fechaRindio: Date | null;
  nota: number | null;
  role: Role;
};

export default function EditUserModal({
  user,
  canEditRole,
  onSave,               // ← recibir la Server Action por props
  triggerClassName = '',
}: {
  user: UserForModal;
  canEditRole: boolean;
  onSave: (formData: FormData) => void;   // ← la acción viene del server
  triggerClassName?: string;
}) {
  const ref = useRef<HTMLDialogElement | null>(null);

  const open = () => ref.current?.showModal();
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={`btn bg-white text-blue-700 border border-blue-600 hover:bg-blue-50
                    ${triggerClassName} mb-3 md:mb-2 lg:mb-auto w-full
                    flex items-center justify-center gap-2 hover:shadow-md transition-shadow hover:cursor-pointer`}
      >
        <Pencil className="h-4 w-4 shrink-0 -mt-px" />
        <span className="lg:whitespace-nowrap leading-none">Editar</span>
      </button>

      <dialog
        ref={ref}
        className="rounded-xl p-2 backdrop:bg-black/50  w-[min(92vw,520px)] fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-primary">Editar datos del alumno</h3>
            <button
              type="button"
              onClick={close}
              className="text-gray-500 hover:text-gray-700 font-bold text-xl"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>

          {/* ← use usa la Server Action que viene por props */}
          <form action={onSave} className="p-5 space-y-3">
            <input type="hidden" name="id" value={user.id} />

            {/* NUEVOS CAMPOS */}
            <label className="block text-sm font-bold">
              Nombre
              <input
                type="text"
                name="nombre"
                defaultValue={user.nombre ?? ''}
                required
                className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-bold">
              Email
              <input
                type="email"
                name="email"
                defaultValue={user.email ?? ''}
                required
                className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-bold">
              Celular
              <input
                type="text"
                name="celular"
                defaultValue={user.celular ?? ''}
                placeholder="Solo números"
                className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </label>
            {/* FIN NUEVOS CAMPOS */}

            <label className="flex items-center gap-2">
              <input type="checkbox" name="egresado" defaultChecked={!!user.egresado} />
              <span className='font-bold'>Egresado</span>
            </label>

            <label className="block text-sm font-bold">
              Fecha rendida
              <input
                type="date"
                name="fechaRindio"
                defaultValue={
                  user.fechaRindio ? new Date(user.fechaRindio).toISOString().split('T')[0] : ''
                }
                className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </label>

            <label className="block text-sm font-bold">
              Nota (0-10)
              <input
                type="number"
                name="nota"
                min={0}
                max={10}
                defaultValue={user.nota ?? ''}
                className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </label>

            {canEditRole && (
              <label className="block text-sm font-bold">
                Rol
                <select
                  name="role"
                  defaultValue={user.role}
                  className="mt-1 w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="ALUMNO">ALUMNO</option>
                  <option value="PROF">PROF</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={close}
                className="border rounded px-4 py-2 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button className="btn" onClick={() => setTimeout(close, 0)}>
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
