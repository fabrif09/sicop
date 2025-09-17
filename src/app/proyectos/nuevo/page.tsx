'use client';

import { useState } from 'react';
import { buscarSimilaresTrgm, createProyecto } from '../actions';

type Form = {
  titulo: string;
  descripcion: string;
  funcionalidades: string; // coma-separadas en el input
  alumnoNombre: string;
  alumnoEmail: string;
  anio: string;           // 👈 string en el estado
  cuatrimestre: string;   // 👈 string en el estado
};

export default function NuevoProyectoPage() {
  const [form, setForm] = useState<Form>({
    titulo: '',
    descripcion: '',
    funcionalidades: '',
    alumnoNombre: '',
    alumnoEmail: '',
    anio: String(new Date().getFullYear()), // guardar como string
    cuatrimestre: '2',
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const funcionalidades = form.funcionalidades
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      // 1) chequeo de duplicados (trigram)
      const candidatos = await buscarSimilaresTrgm({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
        umbral: 0.35,
        limit: 5,
      });

      if (candidatos.length > 0) {
        const lista = candidatos
          .map(c => `• ${c.titulo} (score ${c.score.toFixed(2)})`)
          .join('\n');
        const confirmar = confirm(
          `Posibles duplicados detectados:\n${lista}\n\n¿Desea continuar de todas formas?`
        );
        if (!confirmar) return;
      }

      // 2) crear proyecto (convertimos strings a number recién acá)
      await createProyecto({
        titulo: form.titulo,
        descripcion: form.descripcion,
        funcionalidades,
        alumnoNombre: form.alumnoNombre,
        alumnoEmail: form.alumnoEmail,
        anio: Number(form.anio),
        cuatrimestre: Number(form.cuatrimestre),
      } as any);

      alert('Proyecto creado');
      setForm(s => ({
        ...s,
        titulo: '',
        descripcion: '',
        funcionalidades: '',
      }));
    } catch (err: any) {
      alert(err?.message ?? 'Error al crear el proyecto');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-3">
      <h1 className="text-2xl font-bold">Nuevo Proyecto</h1>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          className="border p-2 w-full"
          placeholder="Título"
          value={form.titulo}
          onChange={e => setForm(s => ({ ...s, titulo: e.target.value }))}
        />
        <textarea
          className="border p-2 w-full"
          placeholder="Descripción"
          value={form.descripcion}
          onChange={e => setForm(s => ({ ...s, descripcion: e.target.value }))}
        />
        <input
          className="border p-2 w-full"
          placeholder="Funcionalidades (separadas por coma)"
          value={form.funcionalidades}
          onChange={e => setForm(s => ({ ...s, funcionalidades: e.target.value }))}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            className="border p-2"
            placeholder="Alumno nombre"
            value={form.alumnoNombre}
            onChange={e => setForm(s => ({ ...s, alumnoNombre: e.target.value }))}
          />
          <input
            className="border p-2"
            placeholder="Alumno email"
            value={form.alumnoEmail}
            onChange={e => setForm(s => ({ ...s, alumnoEmail: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <input
            className="border p-2"
            type="number"
            placeholder="Año"
            value={form.anio}
            onChange={e => setForm(s => ({ ...s, anio: e.target.value }))} // string
          />
          <input
            className="border p-2"
            type="number"
            placeholder="Cuatrimestre"
            value={form.cuatrimestre}
            onChange={e => setForm(s => ({ ...s, cuatrimestre: e.target.value }))} // string
          />
        </div>

        <button disabled={loading} className="border px-4 py-2" type="submit">
          {loading ? 'Creando...' : 'Crear'}
        </button>
      </form>
    </main>
  );
}
