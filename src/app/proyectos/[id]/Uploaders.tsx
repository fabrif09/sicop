// src/app/proyectos/[id]/Uploaders.tsx
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
  const [fileProp, setFileProp] = useState<File | null>(null); //  nuevo para PROPUESTA
  const [busy, setBusy] = useState<'FINAL' | 'PRES' | 'PROP' | null>(null);

  // Reglas
  const canOwnerUploadNow = isOwner && estado === 'APROBADO';
  const canUploadFinal = isStaff || canOwnerUploadNow;
  const canUploadPres = isStaff || canOwnerUploadNow;
  const canUploadProp = isStaff || canOwnerUploadNow; //  permitir PROPUESTA en APROBADO

  async function doUpload(kind: 'PDF_FINAL' | 'PRESENTACION' | 'PROPUESTA') {
    const file =
      kind === 'PDF_FINAL' ? fileFinal :
      kind === 'PRESENTACION' ? filePres : fileProp;
    if (!file) return alert('Seleccioná un PDF');

    if (file.type !== 'application/pdf') return alert('Solo PDF');
    if (file.size > 15 * 1024 * 1024) return alert('PDF > 15MB');

    try {
      setBusy(kind === 'PDF_FINAL' ? 'FINAL' : kind === 'PRESENTACION' ? 'PRES' : 'PROP');

      // 1) key segura
      const safeName = file.name.replace(/\s+/g, '_');
      const folder =
        kind === 'PDF_FINAL' ? 'final' :
        kind === 'PRESENTACION' ? 'presentacion' : 'propuesta'; // ✅

      const key = `proyectos/${proyectoId}/${folder}/${Date.now()}_${safeName}`;

      // 2) pedir presign PUT
      const pres = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file.type, proyectoId }),
      });
      const { url, error } = await pres.json();
      if (error || !url) throw new Error(error || 'No se pudo firmar la subida');

      // 3) subir a storage
      const putRes = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!putRes.ok) throw new Error('Fallo subida');

      // 4) registrar en DB
      await registrarDocumento({
        proyectoId,
        key,
        mime: file.type,
        size: file.size,
        tipo: kind,
      } as any);

      alert('Documento subido');
      if (kind === 'PDF_FINAL') setFileFinal(null);
      else if (kind === 'PRESENTACION') setFilePres(null);
      else setFileProp(null);
      // el servidor revalida la página
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo subir el documento');
    } finally {
      setBusy(null);
    }
  }

  const disabledFinal = !canUploadFinal || busy !== null;
  const disabledPres = !canUploadPres || busy !== null;
  const disabledProp = !canUploadProp || busy !== null;

  return (
    <div className="border rounded p-3">
      {!isStaff && estado === 'PROPUESTO' && (
        <p className="text-sm text-gray-600 mb-2">
          Podés subir el PDF final, la Presentación y nuevas Propuestas cuando tu proyecto esté <b>APROBADO</b>.
        </p>
      )}

      {/* PROPUESTA (visible si está APROBADO) */}
      {estado === 'APROBADO' && (
        <div className="flex items-center gap-3 border rounded p-3 mt-2">
          <div className="flex-1">
            <div className="font-medium">Nueva Propuesta (PDF)</div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileProp(e.target.files?.[0] ?? null)}
              disabled={!canUploadProp || busy === 'PROP'}
              className="mt-1 text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer"
            />
          </div>
          <button
            type="button"
            onClick={() => doUpload('PROPUESTA')}
            disabled={disabledProp}
            className={`btn ${disabledProp ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {busy === 'PROP' ? 'Subiendo…' : 'Subir'}
          </button>
        </div>
      )}

      {/* FINAL */}
      <div className="flex items-center gap-3 border rounded p-3 mt-2">
        <div className="flex-1">
          <div className="font-medium">PDF del proyecto final</div>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFileFinal(e.target.files?.[0] ?? null)}
            disabled={!canUploadFinal || busy === 'FINAL'}
            className="mt-1 text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={() => doUpload('PDF_FINAL')}
          disabled={disabledFinal}
          className={`btn ${disabledFinal ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {busy === 'FINAL' ? 'Subiendo…' : 'Subir'}
        </button>
      </div>

      {/* PRESENTACION */}
      <div className="flex items-center gap-3 border rounded p-3 mt-2">
        <div className="flex-1">
          <div className="font-medium">Presentación (PDF)</div>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFilePres(e.target.files?.[0] ?? null)}
            disabled={!canUploadPres || busy === 'PRES'}
            className="mt-1 text-sm text-gray-700 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 hover:file:cursor-pointer"
          />
        </div>
        <button
          type="button"
          onClick={() => doUpload('PRESENTACION')}
          disabled={disabledPres}
          className={`btn ${disabledPres ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {busy === 'PRES' ? 'Subiendo…' : 'Subir'}
        </button>
      </div>
    </div>
  );
}
