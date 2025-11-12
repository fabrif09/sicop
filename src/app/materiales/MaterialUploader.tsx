// src/app/materiales/MaterialUploader.tsx
'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation'; // ⬅️ nuevo
import { registrarMaterial, reemplazarMaterial } from '@/app/api/materiales/actions';

export default function MaterialUploader({
  replaceId,
  replaceLabel = 'Subir material'
}: { replaceId?: string; replaceLabel?: string }) {
  const inputRef = useRef<HTMLInputElement|null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); // ⬅️ nuevo

  async function onPick() {
    inputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const mime = file.type;
    const ok = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ].includes(mime);
    if (!ok) { alert('Solo PDF o Word'); return; }
    if (file.size > 20*1024*1024) { alert('Máx 20MB'); return; }

    // Nombre seguro
    const safeName = file.name.replace(/\s+/g, '_');
    // ⬇️ MUY IMPORTANTE: usar el MISMO prefijo que guarda el server
    const keyName = `materiales/${safeName}`;

    setLoading(true);
    try {
      // presign upload (firmar EXACTAMENTE la misma key que vas a guardar)
      const pres = await fetch('/api/materiales/presign-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyName, contentType: mime }) // ⬅️ key con prefijo
      });
      const { url, key, error } = await pres.json();
      if (error || !url || !key) throw new Error(error || 'No se pudo firmar la subida');

      // PUT a S3
      const putRes = await fetch(url, { method: 'PUT', headers: { 'Content-Type': mime }, body: file });
      if (!putRes.ok) throw new Error('Fallo subida');

      if (replaceId) {
        // ⬇️ pasar la misma key firmada
        await reemplazarMaterial({ id: replaceId, key, mime, size: file.size } as any);
      } else {
        const titulo = prompt('Título del documento:', file.name.replace(/\.[^.]+$/, '')) || file.name;
        const descripcion = prompt('Descripción breve (opcional):', '') || '';
        const categoria = prompt('Categoría (opcional):', '') || '';
        await registrarMaterial({
          titulo, descripcion, categoria, key, mime, size: file.size
        } as any);
      }
      router.refresh(); // ⬅️ refresca la lista tras revalidatePath del server
    } catch (err:any) {
      alert(err?.message ?? 'Error al subir');
    } finally {
      setLoading(false);
      e.target.value = ''; // reset
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={onFileChange}
        className="hidden"
      />
      <button className="btn" onClick={onPick} disabled={loading}>
        {loading ? 'Subiendo...' : replaceId ? replaceLabel : 'Subir material'}
      </button>
    </>
  );
}
