// src/app/proyectos/[id]/VerPdfBtn.tsx
'use client';

export default function VerPdfBtn({ keyS3 }: { keyS3: string }) {
  async function handleClick() {
  try {
    // Log: avisar al servidor que se abrió un PDF
    await fetch('/api/log/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: keyS3 }),
    });

    // Luego se abre el PDF normalmente
    const r = await fetch('/api/files/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: keyS3 }),
    });
    const { url, error } = await r.json();
    if (error) return alert(error);

    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (e: any) {
    alert(e?.message ?? 'No se pudo abrir el PDF');
  }
}

  return (
    <button
      onClick={handleClick}
      className="btn bg-green-600 hover:bg-green-700 w-full sm:w-auto hover:cursor-pointer"
    >
      Ver PDF
    </button>
  );
}
