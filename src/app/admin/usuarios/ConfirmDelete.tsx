'use client';

import { useState } from 'react';
import { eliminarUsuario } from './serverActions';
import { Trash2 } from 'lucide-react';

export default function ConfirmDeleteModal({ userId, compact = false }: { userId: string; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [motivo, setMotivo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      alert('Ingresá un motivo');
      return;
    }

    const fd = new FormData();
    fd.append('id', userId);
    fd.append('motivo', motivo);

    await eliminarUsuario(fd);
    setOpen(false);
  };

  return (
    <>
      {/* Botón principal */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`btn bg-red-600 hover:bg-red-700 text-white 
          flex items-center justify-center gap-2
          ${compact ? '' : 'w-full'} 
          md:w-full sm:w-full lg:w-auto lg:px-4 lg:py-2 hover:shadow-md transition-shadow hover:cursor-pointer`}
      >
        <Trash2 className="h-4 w-4 shrink-0 -mt-px" />
        <span className="lg:whitespace-nowrap leading-none">Eliminar</span>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold text-red-700 mb-2">Confirmar eliminación</h2>
            <p className="text-sm text-gray-700 mb-4">
              Esta acción eliminará al usuario de forma permanente. ¿Deseás continuar?
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                name="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Motivo de eliminación"
                className="border rounded p-2 w-full text-sm"
                required
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-red-600 hover:bg-red-700 text-white"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
