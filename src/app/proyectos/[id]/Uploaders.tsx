'use client';

import { useState } from 'react';
import { registrarDocumento } from '../actions';

type Props = {
  proyectoId: string;
  estado: 'PROPUESTO' | 'APROBADO' | 'RECHAZADO';
  isOwner: boolean;
  isStaff: boolean;
};

export default function Uploaders({ proyectoId, estado, isOwner, isStaff }: Props) {
  const [fileFinal, setFileFinal] = useState<File | null>(null);
  const [filePres, setFilePres] = useState<File | null>(null);
  const [busy, setBusy] = useState<'FINAL' | 'PRES' | null>(null);

  const canOwnerUploadNow = isOwner && estado === 'APROBADO';
  const canUploadFinal = isStaff || canOwnerUploadNow;
  const canUploadPres = isStaff || canOwnerUploadNow;

  async function doUpload(kind: 'PDF_FINAL' | 'PRESENTACION') {
    const file = kind === 'PDF_FINAL' ? fileFinal : filePres;
    if (!file) return alert('Seleccioná un PDF');

    if (file.type !== 'application/pdf') return alert('Solo PDF');
    if (file.size > 15 * 1024 * 1024) return alert('PDF > 15MB');

    try {
      setBusy(kind === 'PDF_FINAL' ? 'FINAL' : 'PRES');

      const safeName = file.name.replace(/\s+/g, '_');
      const folder = kind === 'PDF_FINAL' ? 'final' : 'presentacion';
      const key = `proyectos/${proyectoId}/${folder}/${Date.now()}_${safeName}`;

      const pres = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file.type, proyectoId }),
      });
      const { url, error } = await pres.json();
      if (error || !url) throw new Error(error || 'No se pudo firmar la subida');

      const putRes = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!putRes.ok) throw new Error('Fallo subida');

      await registrarDocumento({
        proyectoId,
        key,
        mime: file.type,
        size: file.size,
        tipo: kind,
      } as any);

      alert('Documento subido');
      if (kind === 'PDF_FINAL') setFileFinal(null);
      else setFilePres(null);
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo subir el documento');
    } finally {
      setBusy(null);
    }
  }

  const disabledFinal = !canUploadFinal || busy !== null;
  const disabledPres = !canUploadPres || busy !== null;

  return (
    <div className="border rounded p-3">
      {!isStaff && estado === 'PROPUESTO' && (
        <p className="text-sm text-gray-600 mb-2">
          Podés subir el PDF final y la Presentación una vez que tu propuesta esté <b>APROBADA</b>.
        </p>
      )}

      {/* FINAL */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border rounded p-3">
        <div className="flex-1 min-w-0">
          <div className="font-medium">PDF del proyecto final</div>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFileFinal(e.target.files?.[0] ?? null)}
            disabled={!canUploadFinal || busy === 'FINAL'}
            className="mt-1 block w-full max-w-full text-sm text-gray-700
                       file:mr-3 file:py-2 file:px-3 file:rounded file:border-0
                       file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer
                       truncate"
          />
        </div>
        <button
          type="button"
          onClick={() => doUpload('PDF_FINAL')}
          disabled={disabledFinal}
          className={`btn w-full sm:w-auto ${disabledFinal ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {busy === 'FINAL' ? 'Subiendo…' : 'Subir'}
        </button>
      </div>

      {/* PRESENTACION */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border rounded p-3 mt-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium">Presentación (PDF)</div>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFilePres(e.target.files?.[0] ?? null)}
            disabled={!canUploadPres || busy === 'PRES'}
            className="mt-1 block w-full max-w-full text-sm text-gray-700
                       file:mr-3 file:py-2 file:px-3 file:rounded file:border-0
                       file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer
                       truncate"
          />
        </div>
        <button
          type="button"
          onClick={() => doUpload('PRESENTACION')}
          disabled={disabledPres}
          className={`btn w-full sm:w-auto ${disabledPres ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {busy === 'PRES' ? 'Subiendo…' : 'Subir'}
        </button>
      </div>
    </div>
  );
}
