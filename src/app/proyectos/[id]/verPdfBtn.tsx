'use client';

export default function VerPdfBtn({ keyS3 }: { keyS3: string }) {
  async function handleClick() {
    try {
      const r = await fetch('/api/files/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyS3 }),
      });
      const { url, error } = await r.json();
      if (error) return alert(error);
      window.open(url, '_blank');
    } catch (e: any) {
      alert(e?.message ?? 'No se pudo abrir el PDF');
    }
  }

  return (
    <button className="underline" onClick={handleClick}>
      Ver
    </button>
  );
}