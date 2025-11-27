// src/app/admin/usuarios/CrearUsuarioClient.tsx
'use client';

import { useState, useTransition } from 'react';
import {
  crearUsuarioManual,
  registrarDocumentoParaProyecto,
} from './serverActions';
import { UserPlus, CheckCircle2, XCircle, FilePlus2 } from 'lucide-react';

type Rol = 'ALUMNO' | 'PROF' | 'ADMIN';

export default function CrearUsuarioClient({ viewerRole }: { viewerRole: string }) {
  const [open, setOpen] = useState(false);
  const [egresado, setEgresado] = useState<'true' | 'false'>('false');
  const [role, setRole] = useState<Rol>('ALUMNO');
  const [isPending, startTransition] = useTransition();

  // Proyecto (solo ALUMNO)
  const [crearProyecto, setCrearProyecto] = useState(false);
  const [finalFile, setFinalFile] = useState<File | null>(null);

  // Toast
  const [toast, setToast] = useState<{
    show: boolean;
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const emailYPassObligatorios = role === 'PROF' || role === 'ADMIN';

  function showToast(type: 'success' | 'error', text: string) {
    setToast({ show: true, type, text });
    setTimeout(() => setToast((t) => (t ? { ...t, show: false } : t)), 2800);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    // Se guardan campos de proyecto SOLO si ALUMNO y tildó "crear proyecto"
    if (!(role === 'ALUMNO' && crearProyecto)) {
      // se eliminan campos de proyecto para no ensuciar la action
      fd.delete('projectTitulo');
      fd.delete('projectDescripcion');
      fd.delete('projectFuncionalidades');
      fd.delete('projectAnio');
      fd.delete('projectFechaCarga');
    }

    startTransition(async () => {
      try {
        // 1) Crear usuario (y opcionalmente proyecto) en servidor
        const res = await crearUsuarioManual(fd);
        if (!res?.ok) throw new Error('No se pudo crear el usuario');

        const rolSeleccionado = (fd.get('role') as string) ?? role;
        const label =
          viewerRole !== 'ADMIN'
            ? 'Alumno'
            : rolSeleccionado === 'ADMIN'
            ? 'Admin'
            : rolSeleccionado === 'PROF'
            ? 'Profesor'
            : 'Alumno';

        // 2) Si hubo proyecto y (egresado === true) y subieron FINAL, subir + registrar
        const proyectoId = res.proyectoId ?? undefined;
        const esEgresado = role === 'ALUMNO' && egresado === 'true';
        if (proyectoId && esEgresado && finalFile) {
          if (finalFile.type !== 'application/pdf') {
            throw new Error('El archivo final debe ser PDF');
          }
          if (finalFile.size > 50 * 1024 * 1024) {
            throw new Error('El PDF final supera 50MB');
          }

          // Presign PUT
          const safeName = finalFile.name.replace(/\s+/g, '_');
          const key = `proyectos/${proyectoId}/${Date.now()}_${safeName}`;

          const pres = await fetch('/api/upload/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, contentType: finalFile.type, proyectoId }),
          });
          const { url: putUrl, error } = await pres.json();
          if (error || !putUrl) throw new Error(error || 'No se pudo firmar la subida');

          // Subir a storage
          const putRes = await fetch(putUrl, {
            method: 'PUT',
            headers: { 'Content-Type': finalFile.type },
            body: finalFile,
          });
          if (!putRes.ok) throw new Error('Fallo subida del FINAL a almacenamiento');

          // Registrar documento FINAL en el proyecto
          const fdDoc = new FormData();
          fdDoc.set('proyectoId', proyectoId);
          fdDoc.set('key', key);
          fdDoc.set('mime', finalFile.type);
          fdDoc.set('size', String(finalFile.size));
          fdDoc.set('tipo', 'FINAL');
          await registrarDocumentoParaProyecto(fdDoc);
        }

        showToast('success', `Nuevo ${label} cargado exitosamente`);

        // Reset suave
        form.reset();
        setRole('ALUMNO');
        setEgresado('false');
        setCrearProyecto(false);
        setFinalFile(null);
      } catch (err: any) {
        const msg = err?.message || 'No se pudo crear el usuario';
        showToast('error', msg);
      }
    });
  }

  return (
    <section className="bg-white p-4 rounded-lg shadow-sm space-y-3 relative">
      {/* Botón toggle */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn w-full sm:w-auto"
        disabled={isPending}
      >
        {open ? '✖ Cerrar formulario' : (
          <>
            <UserPlus className="inline-block w-5 h-5 mr-1" />
            Crear usuario
          </>
        )}
      </button>

      {/* Form con animación */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          open ? 'max-h-[1400px] opacity-100 mt-4' : 'max-h-0 opacity-0'
        }`}
      >
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input name="nombre" required placeholder="Nombre y apellido"
                 className="border bg-gray-50 p-2 rounded" disabled={isPending} />
          <input name="dni" placeholder="DNI" className="border bg-gray-50 p-2 rounded" disabled={isPending} />
          <input name="celular" placeholder="Celular" className="border bg-gray-50 p-2 rounded" disabled={isPending} />

          {/* Email */}
          <input
            name="email" type="email"
            required={emailYPassObligatorios}
            placeholder={emailYPassObligatorios ? 'Email (obligatorio)' : 'Email (opcional)'}
            className="border bg-gray-50 p-2 rounded" disabled={isPending}
          />

          {/* Rol (solo ADMIN ve el select) */}
          {viewerRole === 'ADMIN' ? (
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as Rol)}
              className="border bg-gray-50 p-2 rounded"
              disabled={isPending}
            >
              <option value="ALUMNO">ALUMNO</option>
              <option value="PROF">PROF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          ) : (
            <input type="hidden" name="role" value="ALUMNO" />
          )}

          {/* Password */}
          <input
            name="password" type="password"
            required={emailYPassObligatorios}
            placeholder={emailYPassObligatorios ? 'Contraseña (obligatoria)' : 'Contraseña (opcional)'}
            className="border bg-gray-50 p-2 rounded" minLength={8} disabled={isPending}
          />

          {/* Egresado solo si ALUMNO */}
          {role === 'ALUMNO' && (
            <select
              name="egresado"
              value={egresado}
              onChange={(e) => setEgresado(e.target.value as 'true'|'false')}
              className="border bg-gray-50 p-2 rounded"
              disabled={isPending}
            >
              <option value="false">No egresado</option>
              <option value="true">Egresado</option>
            </select>
          )}

          {/* Campos de egresado */}
          {role === 'ALUMNO' && egresado === 'true' && (
            <>
              <input name="fechaRindio" type="date" className="border bg-gray-50 p-2 rounded" disabled={isPending} />
              <input name="nota" placeholder="Nota (0-10)" className="border bg-gray-50 p-2 rounded" disabled={isPending} />
            </>
          )}

          {/* ───────────── Proyecto opcional (solo ALUMNO) ───────────── */}
          {role === 'ALUMNO' && (
            <div className="col-span-full">
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={crearProyecto}
                  onChange={(e) => setCrearProyecto(e.target.checked)}
                  className="accent-blue-700"
                  disabled={isPending}
                />
                <span className="inline-flex items-center gap-1">
                  <FilePlus2 className="w-4 h-4" />
                  Cargar proyecto para este alumno
                </span>
              </label>
            </div>
          )}

          {role === 'ALUMNO' && crearProyecto && (
            <>
              <input name="projectTitulo" placeholder="Título del proyecto"
                     className="border bg-gray-50 p-2 rounded" disabled={isPending} />
              <input name="projectAnio" type="number" placeholder="Año"
                     className="border bg-gray-50 p-2 rounded" disabled={isPending}
                     defaultValue={new Date().getFullYear()} />
              <input name="projectFechaCarga" type="date"
                     className="border bg-gray-50 p-2 rounded" disabled={isPending}
                     defaultValue={new Date().toLocaleDateString('es-AR')} />
              <textarea name="projectDescripcion" placeholder="Descripción"
                        className="border bg-gray-50 p-2 rounded md:col-span-3" disabled={isPending} rows={3} />
              <input name="projectFuncionalidades"
                     placeholder="Funcionalidades (separadas por coma)"
                     className="border bg-gray-50 p-2 rounded md:col-span-3" disabled={isPending} />

              {/* Archivo FINAL SOLO si egresado */}
              {egresado === 'true' && (
                <div className="md:col-span-3">
                  <label className="text-sm text-gray-700">PDF Final (solo egresados)</label>
                  <input
                    type="file" accept="application/pdf"
                    onChange={(e) => setFinalFile(e.target.files?.[0] ?? null)}
                    className="mt-1 text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer w-full"
                    disabled={isPending}
                  />
                  {finalFile && (
                    <div className="text-xs text-gray-600 mt-1">
                      {finalFile.name} — {(finalFile.size/1024/1024).toFixed(2)} MB
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="col-span-full">
            <button
              type="submit"
              className="btn w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-60"
              disabled={isPending}
            >
              <UserPlus className="w-5 h-5" />
              {isPending ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast */}
      {toast?.show && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed md:bottom-6 md:right-6 bottom-4 left-4 right-4 md:left-auto z-50 rounded-lg shadow-lg border px-4 py-3 flex items-center gap-3 transition-all duration-300
          ${toast.type === 'success' ? 'bg-white border-green-600' : 'bg-white border-red-600'}`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          ) : (
            <XCircle className="w-5 h-5 text-red-600" />
          )}
          <p className="text-sm">{toast.text}</p>
        </div>
      )}
    </section>
  );
}
