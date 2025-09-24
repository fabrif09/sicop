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

export default function NuevoProyectoPage() {
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
      if (!form.file) return alert('Adjuntá el PDF del proyecto');
      if (form.file.type !== 'application/pdf') return alert('Solo PDF');
      if (form.file.size > 15 * 1024 * 1024) return alert('PDF > 15MB');

      const funcionalidades = form.funcionalidades.split(',').map(s=>s.trim()).filter(Boolean);

      // 1) sugerir posibles duplicados (no bloquea)
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
          return;
        }
      }

      // 2) crear proyecto (estado APROBADO ya del lado servidor)
      const proyectoId = await createProyecto({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
        alumnoNombre: form.alumnoNombre,
        alumnoEmail: form.alumnoEmail,
        anio: Number(form.anio),
        fechaCarga: form.fechaCarga,
      } as any);

      // 3) presign PUT
      const safeName = form.file.name.replace(/\s+/g, '_');
      const key = `proyectos/${proyectoId}/${Date.now()}_${safeName}`;
      const pres = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: form.file.type, proyectoId }),
      });
      const { url: putUrl, error } = await pres.json();
      if (error || !putUrl) throw new Error(error || 'No se pudo firmar la subida');

      // 4) subir a S3
      const putRes = await fetch(putUrl, { method: 'PUT', headers: { 'Content-Type': form.file.type }, body: form.file });
      if (!putRes.ok) throw new Error('Fallo subida a almacenamiento');

      // 5) registrar documento en DB
      await registrarDocumento({
        proyectoId,
        key,
        mime: form.file.type,
        size: form.file.size,
        tipo: 'PDF_FINAL',
        version: 1,
      } as any);

      // 6) (opcional) checksum
      const checksum = await sha256(form.file);
      try { await setProyectoChecksum({ proyectoId, checksum } as any); } catch {}

      alert('Proyecto creado y PDF subido');
      setForm(s => ({ ...s, titulo: '', descripcion: '', funcionalidades: '', file: null }));
    } catch (err: any) {
      alert(err?.message ?? 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Título"
          value={form.titulo} onChange={e=>setForm(s=>({...s, titulo: e.target.value}))}/>
        <textarea className="border p-2 w-full" placeholder="Descripción"
          value={form.descripcion} onChange={e=>setForm(s=>({...s, descripcion: e.target.value}))}/>
        <input className="border p-2 w-full" placeholder="Funcionalidades (separadas por coma)"
          value={form.funcionalidades} onChange={e=>setForm(s=>({...s, funcionalidades: e.target.value}))}/>
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" placeholder="Nombre y Apellido"
            value={form.alumnoNombre} onChange={e=>setForm(s=>({...s, alumnoNombre: e.target.value}))}/>
          <input className="border p-2" placeholder="Email"
            value={form.alumnoEmail} onChange={e=>setForm(s=>({...s, alumnoEmail: e.target.value}))}/>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" type="number" placeholder="Año"
            value={form.anio} onChange={e=>setForm(s=>({...s, anio: e.target.value}))}/>
          <input className="border p-2" type="date"
            value={form.fechaCarga} onChange={e=>setForm(s=>({...s, fechaCarga: e.target.value}))}/>
        </div>
        <div>
          <input type="file" accept="application/pdf"
            onChange={e=>setForm(s=>({...s, file: e.target.files?.[0] ?? null}))}/>
          {form.file && <div className="text-sm text-gray-600 mt-1">{form.file.name} — {(form.file.size/1024/1024).toFixed(2)} MB</div>}
        </div>
        <button disabled={loading} className="border px-4 py-2" type="submit">
          {loading ? 'Subiendo...' : 'Crear proyecto y subir PDF'}
        </button>
      </form>
    </main>
  );
}
