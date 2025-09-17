/*'use client';

import { useState } from 'react';
import { registrarDocumento } from '../actions';

async function sha256Hex(file: File) {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Uploader({ proyectoId }: { proyectoId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function onUpload() {
    if (!file) return;
    if (file.type !== 'application/pdf') { alert('Solo PDF'); return; }
    if (file.size > 15 * 1024 * 1024) { alert('Máx 15MB'); return; }

    setLoading(true);
    try {
      // 1) checksum
      const checksum = await sha256Hex(file);

      // 2) pedir URL pre-firmada
      const key = `proyectos/${proyectoId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file.type }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);

      // 3) subir a MinIO por PUT
      const put = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!put.ok) throw new Error('Error subiendo el PDF');

      // 4) registrar metadatos
      // Nota: en MinIO, la URL pública depende de cómo lo expongas. Para dev, guardo la Key.
      await registrarDocumento({
        proyectoId,
        url: key, // o construí tu URL pública si tenés reverse proxy
        mime: file.type,
        size: file.size,
        tipo: 'PROPUESTA',
        version: 1,
        checksum,
      } as any);

      alert('PDF subido');
      setFile(null);
      // podés hacer location.reload() o usar router.refresh() si querés ver la lista actualizada
    } catch (e: any) {
      alert(e.message ?? 'Fallo la subida');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border p-3 rounded space-y-2 max-w-md">
      <div className="font-medium">Subir PDF</div>
      <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
      <button className="border px-3 py-1 rounded" disabled={!file || loading} onClick={onUpload}>
        {loading ? 'Subiendo...' : 'Subir'}
      </button>
    </div>
  );
}*/
