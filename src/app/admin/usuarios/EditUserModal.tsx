'use client';

import { useRef } from 'react';
import type { Role } from '@prisma/client';

type UserForModal = {
  id: string;
  egresado: boolean | null;
  fechaRindio: Date | null;
  nota: number | null;
  role: Role;
};

export default function EditUserModal({
  user,
  canEditRole,
  onSave,
  triggerClassName = '',
}: {
  user: UserForModal;
  canEditRole: boolean;
  // Server Action (se pasa desde el server component)
  onSave: (formData: FormData) => void;
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
        className={`btn bg-white text-blue-700 border border-blue-600 hover:bg-blue-50 ${triggerClassName}`}
      >
        Editar datos
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

          <form action={onSave} className="p-5 space-y-3">
            <input type="hidden" name="id" value={user.id} />

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="egresado"
                defaultChecked={!!user.egresado}
              />
              <span className='font-bold'>Egresado</span>
            </label>

            <label className="block text-sm font-bold">
              Fecha rendida
              <input
                type="date"
                name="fechaRindio"
                defaultValue={
                  user.fechaRindio ? new Date(user.fechaRindio).toISOString().slice(0, 10) : ''
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
              <button
                className="btn"
                onClick={() => setTimeout(close, 0)}
              >
                Guardar cambios
              </button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
