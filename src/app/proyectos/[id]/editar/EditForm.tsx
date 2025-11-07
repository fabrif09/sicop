'use client';
import { useState } from 'react';
import { updateProyecto, buscarSimilaresTrgm } from '../../actions';
import { useRouter } from 'next/navigation';

type P = {
  id: string;
  titulo: string;
  descripcion: string;
  funcionalidades: string[];
  alumnoNombre: string;
  alumnoEmail: string;
  anio: number;
  fechaCarga: string; // yyyy-mm-dd
  estado: 'PROPUESTO' | 'APROBADO' | 'RECHAZADO';
};

export default function EditForm({ proyecto }: { proyecto: P }) {
  const router = useRouter();
  const [f, setF] = useState({
    titulo: proyecto.titulo,
    descripcion: proyecto.descripcion,
    funcionalidades: proyecto.funcionalidades.join(', '),
    alumnoNombre: proyecto.alumnoNombre,
    alumnoEmail: proyecto.alumnoEmail,
    anio: String(proyecto.anio),
    fechaCarga: proyecto.fechaCarga,
    estado: proyecto.estado,
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const funcionalidades = f.funcionalidades.split(',').map(s=>s.trim()).filter(Boolean);

      const cand = await buscarSimilaresTrgm({
        titulo: f.titulo,
        descripcion: f.descripcion,
        funcionalidades,
        umbral: 0.35,
        limit: 5,
      });
      if (cand.length > 0 && !confirm('Se detectaron proyectos similares. ¿Continuar igualmente?')) {
        return;
      }

      await updateProyecto({
        id: proyecto.id,
        titulo: f.titulo,
        descripcion: f.descripcion,
        funcionalidades,
        alumnoNombre: f.alumnoNombre,
        alumnoEmail: f.alumnoEmail,
        anio: Number(f.anio),
        fechaCarga: f.fechaCarga,
        estado: f.estado,
      } as any);

      alert('Proyecto actualizado');
      router.push(`/proyectos/${proyecto.id}`);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo actualizar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          value={f.titulo}
          onChange={e=>setF(s=>({...s, titulo: e.target.value}))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          className="border border-gray-300 rounded w-full p-2 min-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          value={f.descripcion}
          onChange={e=>setF(s=>({...s, descripcion: e.target.value}))}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Funcionalidades (separadas por coma)</label>
        <input
          className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
          value={f.funcionalidades}
          onChange={e=>setF(s=>({...s, funcionalidades: e.target.value}))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre y Apellido</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={f.alumnoNombre}
            onChange={e=>setF(s=>({...s, alumnoNombre: e.target.value}))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={f.alumnoEmail}
            onChange={e=>setF(s=>({...s, alumnoEmail: e.target.value}))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            type="number"
            value={f.anio}
            onChange={e=>setF(s=>({...s, anio: e.target.value}))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de carga</label>
          <input
            className="border border-gray-300 rounded w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            type="date"
            value={f.fechaCarga}
            onChange={e=>setF(s=>({...s, fechaCarga: e.target.value}))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            className="border border-gray-300 rounded w-full p-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            value={f.estado}
            onChange={e=>setF(s=>({...s, estado: e.target.value as any}))}
          >
            <option value="PROPUESTO">Propuesto</option>
            <option value="APROBADO">Aprobado</option>
            <option value="RECHAZADO">Rechazado</option>
          </select>
        </div>
      </div>

      <button disabled={loading} className="btn w-full" type="submit">
        {loading ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  );
}
