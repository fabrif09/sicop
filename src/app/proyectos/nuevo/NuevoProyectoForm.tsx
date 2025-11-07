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
  file?: File | null;
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
    file: null,
  });
  const [loading, setLoading] = useState(false);

  async function sha256(file: File) {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (!form.titulo.trim() || !form.descripcion.trim()) return alert('Título y descripción son obligatorios');
      if (!form.alumnoNombre.trim() || !form.alumnoEmail.trim()) return alert('Datos del alumno obligatorios');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.alumnoEmail)) return alert('Email inválido');
      if (!form.file) return alert('Adjuntá el PDF de la PROPUESTA');
      if (form.file.type !== 'application/pdf') return alert('Solo PDF');
      if (form.file.size > 15 * 1024 * 1024) return alert('PDF > 15MB');

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

      // 1) Crear proyecto (PROPUESTO por defecto)
      const proyectoId = await createProyecto({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
        alumnoNombre: form.alumnoNombre,
        alumnoEmail: form.alumnoEmail,
        anio: Number(form.anio),
        fechaCarga: form.fechaCarga,
      } as any);

      // 2) Presign PUT
      const safeName = form.file.name.replace(/\s+/g, '_');
      const key = `proyectos/${proyectoId}/${Date.now()}_${safeName}`;
      const pres = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: form.file.type, proyectoId }),
      });
      const { url: putUrl, error } = await pres.json();
      if (error || !putUrl) throw new Error(error || 'No se pudo firmar la subida');

      // 3) Subir a storage
      const putRes = await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': form.file.type }, body: form.file });
      if (!putRes.ok) throw new Error('Fallo subida a almacenamiento');

      // 4) Registrar documento como PROPUESTA
      await registrarDocumento({
        proyectoId,
        key,
        mime: form.file.type,
        size: form.file.size,
        tipo: 'PROPUESTA',
      } as any);

      // 5) (opcional) checksum
      const checksum = await sha256(form.file);
      try { await setProyectoChecksum({ proyectoId, checksum } as any); } catch {}

      alert('Propuesta enviada. La cátedra debe aprobar para habilitar el PDF final y la presentación.');
      setForm(s => ({ ...s, titulo: '', descripcion: '', funcionalidades: '', file: null }));
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
        <input className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.titulo} onChange={e=>setForm(s=>({...s, titulo: e.target.value}))} placeholder="Ej: Sistema de Turnos"/>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Descripción</label>
        <textarea className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          rows={4}
          value={form.descripcion} onChange={e=>setForm(s=>({...s, descripcion: e.target.value}))} placeholder="Breve descripción del proyecto"/>
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-gray-700">Funcionalidades (separadas por coma)</label>
        <input className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
          value={form.funcionalidades} onChange={e=>setForm(s=>({...s, funcionalidades: e.target.value}))}
          placeholder="auth, panel admin, reportes, etc."/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Nombre y Apellido</label>
          <input className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.alumnoNombre} onChange={e=>setForm(s=>({...s, alumnoNombre: e.target.value}))}/>
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Email</label>
          <input className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            value={form.alumnoEmail} onChange={e=>setForm(s=>({...s, alumnoEmail: e.target.value}))}/>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Año</label>
          <input className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            type="number" value={form.anio} onChange={e=>setForm(s=>({...s, anio: e.target.value}))}/>
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">Fecha de carga</label>
          <input className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-primary"
            type="date" value={form.fechaCarga} onChange={e=>setForm(s=>({...s, fechaCarga: e.target.value}))}/>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block text-sm text-gray-700">PDF (Propuesta)</label>
        <input type="file" accept="application/pdf" className="text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer"
          onChange={e=>setForm(s=>({...s, file: e.target.files?.[0] ?? null}))}/>
        {form.file && (
          <div className="text-sm text-gray-600 mt-1 ">
            {form.file.name} — {(form.file.size/1024/1024).toFixed(2)} MB
          </div>
        )}
      </div>

      <button disabled={loading} className="btn w-full hover:cursor-pointer" type="submit">
        {loading ? 'Subiendo...' : 'Enviar propuesta'}
      </button>
    </form>
  );
}
