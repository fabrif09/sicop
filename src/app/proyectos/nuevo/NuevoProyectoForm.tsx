// src/app/proyectos/nuevo/NuevoProyectoForm.tsx
'use client';

import { useState } from 'react';
import { buscarSimilaresTrgm, createProyecto, registrarDocumento, setProyectoChecksum } from '../actions';

type Form = {
  titulo: string;
  descripcion: string;
  funcionalidades: string;
  propuesta?: File | null;
  historia?: File | null;
};

export default function NuevoProyectoForm() {
  const [form, setForm] = useState<Form>({
    titulo: '',
    descripcion: '',
    funcionalidades: '',
    propuesta: null,
    historia: null,
  });
  const [loading, setLoading] = useState(false);

  async function sha256(file: File) {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function assertPdf(file: File | null, label: string) {
    if (!file) throw new Error(`Adjuntá el PDF de ${label}`);
    if (file.type !== 'application/pdf') throw new Error(`${label}: solo PDF`);
    if (file.size > 15 * 1024 * 1024) throw new Error(`${label}: supera 15MB`);
  }

  async function uploadWithPresign(key: string, file: File, proyectoId: string) {
    const pres = await fetch('/api/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, contentType: file.type, proyectoId }),
    });
    const { url: putUrl, error } = await pres.json();
    if (error || !putUrl) throw new Error(error || 'No se pudo firmar la subida');

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });
    if (!putRes.ok) throw new Error('Fallo subida a almacenamiento');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.titulo.trim() || !form.descripcion.trim()) {
        throw new Error('Título y descripción son obligatorios');
      }

      // ✔ Validar ambos PDFs obligatorios
      assertPdf(form.propuesta ?? null, 'la PROPUESTA');
      assertPdf(form.historia ?? null, 'la HISTORIA ACADÉMICA');

      const funcionalidades = form.funcionalidades
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      // Sugerencias de similares (informativo)
      const candidatos = await buscarSimilaresTrgm({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
        umbral: 0.35,
        limit: 5,
      });
      if (candidatos.length > 0) {
        const lista = candidatos
          .map(c => `• ${c.titulo} — ${c.alumnoNombre} — ${new Date(c.fechaCarga).toLocaleDateString('es-AR')} (score ${c.score.toFixed(2)})`)
          .join('\n');
        if (!confirm(`Se detectaron proyectos similares:\n${lista}\n\n¿Deseás continuar igualmente?`)) {
          setLoading(false);
          return;
        }
      }

      // 1) Crear proyecto (queda PROPUESTO) — nombre/email y fechas se toman del server
      const proyectoId = await createProyecto({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
      } as any);

      // 2) Subir ambos archivos a storage con nombres claros
      const safeNameProp = (form.propuesta as File).name.replace(/\s+/g, '_');
      const keyProp = `proyectos/${proyectoId}/propuesta/${Date.now()}_${safeNameProp}`;

      const safeNameHist = (form.historia as File).name.replace(/\s+/g, '_');
      const keyHist = `proyectos/${proyectoId}/historia_academica/${Date.now()}_${safeNameHist}`;

      await uploadWithPresign(keyProp, form.propuesta as File, proyectoId);
      await uploadWithPresign(keyHist, form.historia as File, proyectoId);

      // 3) Registrar documentos
      await registrarDocumento({
        proyectoId,
        key: keyProp,
        mime: (form.propuesta as File).type,
        size: (form.propuesta as File).size,
        tipo: 'PROPUESTA',
      } as any);

      // Historia académica como OTRO (key en carpeta 'historia_academica')
      await registrarDocumento({
        proyectoId,
        key: keyHist,
        mime: (form.historia as File).type,
        size: (form.historia as File).size,
        tipo: 'OTRO',
      } as any);

      // 4) (opcional) checksum de la propuesta
      try {
        const checksum = await sha256(form.propuesta as File);
        await setProyectoChecksum({ proyectoId, checksum } as any);
      } catch {}

      alert('¡Listo! Enviamos tu PROPUESTA y tu HISTORIA ACADÉMICA. La cátedra revisará la documentación.');
      setForm(s => ({
        ...s,
        titulo: '',
        descripcion: '',
        funcionalidades: '',
        propuesta: null,
        historia: null,
      }));
    } catch (err: any) {
      alert(err?.message ?? 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="
        mx-auto max-w-2xl
        bg-white shadow-sm rounded-lg
        p-4 sm:p-5 md:p-6
        space-y-4
      "
    >
      {/* Nota informativa (responsiva) */}
      <div className="rounded-md border border-blue-100 bg-blue-50 text-blue-900 text-sm p-3">
        La <b>fecha</b> y el <b>año</b> de carga se registran automáticamente al enviar.
      </div>

      {/* Campos de texto */}
      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Título</label>
        <input
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.titulo}
          onChange={e => setForm(s => ({ ...s, titulo: e.target.value }))}
          placeholder="Ej: Sistema de Turnos"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Descripción</label>
        <textarea
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
          value={form.descripcion}
          onChange={e => setForm(s => ({ ...s, descripcion: e.target.value }))}
          placeholder="Breve descripción del proyecto"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Funcionalidades (separadas por coma)</label>
        <input
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.funcionalidades}
          onChange={e => setForm(s => ({ ...s, funcionalidades: e.target.value }))}
          placeholder="auth, panel admin, reportes, etc."
        />
      </div>

      {/* Archivos — grid responsiva para no romperse en medianas */}
      <div
        className="
          grid grid-cols-1 gap-4
          md:grid-cols-2
        "
      >
        {/* PDF Propuesta */}
        <div className="space-y-1">
          <label className="block text-sm text-gray-700">PDF (Propuesta) — obligatorio</label>
          <input
            type="file"
            accept="application/pdf"
            className="
              w-full text-gray-700
              file:mr-3 file:py-2 file:px-3 file:rounded file:border-0
              file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer
            "
            onChange={e => setForm(s => ({ ...s, propuesta: e.target.files?.[0] ?? null }))}
          />
          {form.propuesta && (
            <div className="text-sm text-gray-600 mt-1 break-all">
              {form.propuesta.name} — {(form.propuesta.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>

        {/* PDF Historia Académica */}
        <div className="space-y-1">
          <label className="block text-sm text-gray-700">PDF (Historia Académica) — obligatorio</label>
          <input
            type="file"
            accept="application/pdf"
            className="
              w-full text-gray-700
              file:mr-3 file:py-2 file:px-3 file:rounded file:border-0
              file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer
            "
            onChange={e => setForm(s => ({ ...s, historia: e.target.files?.[0] ?? null }))}
          />
          {form.historia && (
            <div className="text-sm text-gray-600 mt-1 break-all">
              {form.historia.name} — {(form.historia.size / 1024 / 1024).toFixed(2)} MB
            </div>
          )}
        </div>
      </div>

      <button
        disabled={loading}
        className="btn w-full hover:cursor-pointer"
        type="submit"
      >
        {loading ? 'Subiendo...' : 'Enviar documentación'}
      </button>
    </form>
  );
}
