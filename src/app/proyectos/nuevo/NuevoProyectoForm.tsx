// src/app/proyectos/nuevo/NuevoProyectoForm.tsx
'use client';

import { useState } from 'react';
import { buscarSimilaresTrgm, createProyecto, registrarDocumento, setProyectoChecksum } from '../actions';

type Form = {
  titulo: string;
  descripcion: string;
  funcionalidades: string;
  alumnoNombre: string;
  alumnoEmail: string;
  anio: string;
  fechaCarga: string; // yyyy-mm-dd
  propuesta?: File | null;
  historia?: File | null;
};

export default function NuevoProyectoForm() {
  const [form, setForm] = useState<Form>({
    titulo: '',
    descripcion: '',
    funcionalidades: '',
    alumnoNombre: '',
    alumnoEmail: '',
    anio: String(new Date().getFullYear()),
    fechaCarga: new Date().toISOString().slice(0, 10),
    propuesta: null,
    historia: null,
  });
  const [loading, setLoading] = useState(false);

  async function sha256(file: File) {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
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
      body: JSON.stringify({ key, contentType: file.type, proyectoId }), // 👈 acá vuelve el proyectoId
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
      if (!form.titulo.trim() || !form.descripcion.trim()) throw new Error('Título y descripción son obligatorios');
      if (!form.alumnoNombre.trim() || !form.alumnoEmail.trim()) throw new Error('Datos del alumno obligatorios');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.alumnoEmail)) throw new Error('Email inválido');

      // ✔ Validar ambos PDFs obligatorios
      assertPdf(form.propuesta ?? null, 'la PROPUESTA');
      assertPdf(form.historia ?? null, 'la HISTORIA ACADÉMICA');

      const funcionalidades = form.funcionalidades.split(',').map(s=>s.trim()).filter(Boolean);

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
          .map(c => `• ${c.titulo} — ${c.alumnoNombre} — ${new Date(c.fechaCarga).toISOString().slice(0,10)} (score ${c.score.toFixed(2)})`)
          .join('\n');
        if (!confirm(`Se detectaron proyectos similares:\n${lista}\n\n¿Deseás continuar igualmente?`)) {
          setLoading(false);
          return;
        }
      }

      // 1) Crear proyecto (queda PROPUESTO)
      const proyectoId = await createProyecto({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
        alumnoNombre: form.alumnoNombre,
        alumnoEmail: form.alumnoEmail,
        anio: Number(form.anio),
        fechaCarga: form.fechaCarga,
      } as any);

      // 2) Subir ambos archivos a storage con nombres claros
      const safeNameProp = (form.propuesta as File).name.replace(/\s+/g, '_');
      const keyProp = `proyectos/${proyectoId}/propuesta/${Date.now()}_${safeNameProp}`;

      const safeNameHist = (form.historia as File).name.replace(/\s+/g, '_');
      // 👇 carpeta/nombre distintivo para poder permitir OTRO en estado PROPUESTO
      const keyHist = `proyectos/${proyectoId}/historia_academica/${Date.now()}_${safeNameHist}`;

      await uploadWithPresign(keyProp, form.propuesta as File, proyectoId);
      await uploadWithPresign(keyHist, form.historia as File, proyectoId);

      // 3) Registrar documentos
      // 3.a PROPUESTA (permitido en PROPUESTO)
      await registrarDocumento({
        proyectoId,
        key: keyProp,
        mime: (form.propuesta as File).type,
        size: (form.propuesta as File).size,
        tipo: 'PROPUESTA',
      } as any);

      // 3.b HISTORIA ACADÉMICA — usamos tipo 'OTRO' pero con key en carpeta 'historia_academica'
      //     (requiere el pequeño ajuste en registrarDocumento para permitirlo en PROPUESTO)
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
    <form onSubmit={onSubmit} className="space-y-3 bg-white shadow-sm rounded-lg p-4">
      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Título</label>
        <input
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.titulo}
          onChange={e=>setForm(s=>({...s, titulo: e.target.value}))}
          placeholder="Ej: Sistema de Turnos"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Descripción</label>
        <textarea
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
          value={form.descripcion}
          onChange={e=>setForm(s=>({...s, descripcion: e.target.value}))}
          placeholder="Breve descripción del proyecto"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Funcionalidades (separadas por coma)</label>
        <input
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.funcionalidades}
          onChange={e=>setForm(s=>({...s, funcionalidades: e.target.value}))}
          placeholder="auth, panel admin, reportes, etc."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Nombre y Apellido</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.alumnoNombre}
            onChange={e=>setForm(s=>({...s, alumnoNombre: e.target.value}))}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Email</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.alumnoEmail}
            onChange={e=>setForm(s=>({...s, alumnoEmail: e.target.value}))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Año</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            type="number"
            value={form.anio}
            onChange={e=>setForm(s=>({...s, anio: e.target.value}))}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Fecha de carga</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            type="date"
            value={form.fechaCarga}
            onChange={e=>setForm(s=>({...s, fechaCarga: e.target.value}))}
          />
        </div>
      </div>

      {/* PDF Propuesta */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">PDF (Propuesta) — obligatorio</label>
        <input
          type="file"
          accept="application/pdf"
          className="text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer"
          onChange={e=>setForm(s=>({...s, propuesta: e.target.files?.[0] ?? null}))}
        />
        {form.propuesta && (
          <div className="text-sm text-gray-600 mt-1">
            {form.propuesta.name} — {(form.propuesta.size/1024/1024).toFixed(2)} MB
          </div>
        )}
      </div>

      {/* PDF Historia Académica */}
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">PDF (Historia Académica) — obligatorio</label>
        <input
          type="file"
          accept="application/pdf"
          className="text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer"
          onChange={e=>setForm(s=>({...s, historia: e.target.files?.[0] ?? null}))}
        />
        {form.historia && (
          <div className="text-sm text-gray-600 mt-1">
            {form.historia.name} — {(form.historia.size/1024/1024).toFixed(2)} MB
          </div>
        )}
      </div>

      <button disabled={loading} className="btn w-full hover:cursor-pointer" type="submit">
        {loading ? 'Subiendo...' : 'Enviar documentación'}
      </button>
    </form>
  );
}
