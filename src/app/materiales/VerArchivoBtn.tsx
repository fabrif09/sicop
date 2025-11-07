'use client';

export default function VerArchivoBtn({ keyS3 }: { keyS3: string }) {
  async function handleClick() {
    try {
      const r = await fetch('/api/materiales/presign-get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyS3 }),
      });
      const { url, error } = await r.json();
      if (error) return alert(error);
      window.open(url, '_blank'); // descarga/visualiza según MIME
    } catch (e:any) {
      alert(e?.message ?? 'No se pudo abrir el archivo');
    }
  }
  return <button className="btn bg-white text-blue-700 border border-blue-600 hover:bg-blue-50" onClick={handleClick}>Descargar</button>;
}
