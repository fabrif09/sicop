'use client';

import { useState } from 'react';
import { buscarSimilaresTrgm, createProyecto, registrarDocumento, setProyectoChecksum } from '../actions';
import { useRouter } from 'next/navigation';

type Similar = { id: string; titulo: string; alumnoNombre: string; fechaCarga: string | Date; score: number };
type Form = {
  titulo: string; descripcion: string; funcionalidades: string;
  alumnoNombre: string; alumnoEmail: string;
  anio: string; fechaCarga: string;
};

async function sha256Hex(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function NuevoProyectoPage() {
  const router = useRouter();

  const [form, setForm] = useState<Form>({
    titulo: '', descripcion: '', funcionalidades: '',
    alumnoNombre: '', alumnoEmail: '',
    anio: String(new Date().getFullYear()),
    fechaCarga: new Date().toISOString().slice(0, 10),
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [candidatos, setCandidatos] = useState<Similar[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [pendingFuncs, setPendingFuncs] = useState<string[] | null>(null);

  function fmt(d: string | Date) {
    const dd = typeof d === 'string' ? new Date(d) : d;
    return dd.toISOString().slice(0,10);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      // validaciones mínimas
      if (!form.titulo.trim() || !form.descripcion.trim()) { alert('Título y descripción son obligatorios'); return; }
      if (!form.alumnoNombre.trim() || !form.alumnoEmail.trim()) { alert('Nombre y email del alumno son obligatorios'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.alumnoEmail)) { alert('Email inválido'); return; }
      const today = new Date().toISOString().slice(0,10);
      if (form.fechaCarga > today) { alert('La fecha de carga no puede ser futura'); return; }
      if (!file) { alert('Adjuntá el PDF del proyecto'); return; }
      if (file.type !== 'application/pdf') { alert('Solo PDF'); return; }
      if (file.size > 15 * 1024 * 1024) { alert('Máx 15MB'); return; }

      const funcionalidades = form.funcionalidades.split(',').map(s => s.trim()).filter(Boolean);

      // 1) posibles duplicados
      const cand = await buscarSimilaresTrgm({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
        umbral: 0.35,
        limit: 5,
      });
      if (cand.length > 0) {
        setCandidatos(cand);
        setPendingFuncs(funcionalidades);
        setShowModal(true);
        return;
      }

      await crearConUpload(funcionalidades);
    } catch (err: any) {
      alert(err?.message ?? 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  }

  async function crearConUpload(funcionalidades: string[]) {
    // 2) crear proyecto (id para la Key)
    const proyectoId = await createProyecto({
      titulo: form.titulo,
      descripcion: form.descripcion,
      funcionalidades,
      alumnoNombre: form.alumnoNombre,
      alumnoEmail: form.alumnoEmail,
      anio: Number(form.anio),
      fechaCarga: form.fechaCarga,
    } as any);

    try {
      // 3) checksum
      const checksum = await sha256Hex(file!);

      // 4) pedir presigned URL
      const key = `proyectos/${proyectoId}/${Date.now()}_${file!.name.replace(/\s+/g, '_')}`;
      const pres = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file!.type }),
      });
      const { url, error } = await pres.json();
      if (error) throw new Error(error);

      // 5) PUT a S3/MinIO
      const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file!.type }, body: file });
      if (!put.ok) throw new Error('Error subiendo el PDF');

      // 6) registrar documento y checksum
      await registrarDocumento({
        proyectoId,
        key,
        mime: file!.type,
        size: file!.size,
        tipo: 'PROPUESTA',
        version: 1,
      } as any);

      await setProyectoChecksum({ proyectoId, checksum });

      alert('Proyecto creado y PDF subido');
      router.push(`/proyectos/${proyectoId}`);
    } catch (e: any) {
      // ⚠️ compensación: si falla el upload/registro, borro el proyecto
      await fetch('/api/proyectos/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proyectoId }),
      });
      alert(e.message ?? 'Falló la subida; se deshizo la creación del proyecto');
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>

      <form onSubmit={onSubmit} className="space-y-2">
        {/* …inputs como ya los tenías… */}
        <input className="border p-2 w-full" placeholder="Título"
          value={form.titulo} onChange={e=>setForm(s=>({...s,titulo:e.target.value}))}/>
        <textarea className="border p-2 w-full" placeholder="Descripción"
          value={form.descripcion} onChange={e=>setForm(s=>({...s,descripcion:e.target.value}))}/>
        <input className="border p-2 w-full" placeholder="Funcionalidades (separadas por coma)"
          value={form.funcionalidades} onChange={e=>setForm(s=>({...s,funcionalidades:e.target.value}))}/>

        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" placeholder="Alumno nombre"
            value={form.alumnoNombre} onChange={e=>setForm(s=>({...s,alumnoNombre:e.target.value}))}/>
          <input className="border p-2" placeholder="Alumno email"
            value={form.alumnoEmail} onChange={e=>setForm(s=>({...s,alumnoEmail:e.target.value}))}/>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input className="border p-2" type="number" placeholder="Año"
            value={form.anio} onChange={e=>setForm(s=>({...s,anio:e.target.value}))}/>
          <input className="border p-2" type="date"
            value={form.fechaCarga} onChange={e=>setForm(s=>({...s,fechaCarga:e.target.value}))}/>
        </div>

        {/* PDF */}
        <div className="border p-3 rounded">
          <div className="font-medium mb-1">PDF del proyecto</div>
          <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0] ?? null)} />
        </div>

        <button disabled={loading} className="border px-4 py-2" type="submit">
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </form>

      {/* Modal (idéntico al que ya tenías, con alumnos/fecha) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-full max-w-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Posibles duplicados</h2>
            <ul className="space-y-1 max-h-60 overflow-auto">
              {candidatos.map(c=>(
                <li key={c.id} className="border rounded p-2">
                  <div className="font-medium">{c.titulo}</div>
                  <div className="text-sm text-gray-600">
                    Alumno: {c.alumnoNombre} — Fecha: {fmt(c.fechaCarga)} — Score: {c.score.toFixed(2)}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2 justify-end">
              <button className="border px-3 py-1 rounded" onClick={()=>{
                setShowModal(false); setCandidatos([]); setPendingFuncs(null);
              }}>Cancelar</button>
              <button className="border px-3 py-1 rounded" onClick={async ()=>{
                if (pendingFuncs) {
                  setShowModal(false);
                  await crearConUpload(pendingFuncs);
                }
              }}>Continuar igualmente</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
