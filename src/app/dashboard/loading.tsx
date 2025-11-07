// src/app/dashboard/loading.tsx
'use client';

import { useEffect, useState } from 'react';

export default function Loading() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // gatilla la animación después del primer render
    const t = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-start bg-gray-50 px-4">
      <div
        className={`
          bg-white shadow-md rounded-lg p-6 w-full max-w-md
          text-center space-y-3
          transform transition-all duration-300 ease-out
          ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
        `}
      >
        <h1 className="text-2xl font-bold text-primary">
          Cargando panel...
        </h1>

        <p className="text-gray-600 text-sm animate-pulse">
          Por favor esperá un momento
        </p>

        <div className="flex justify-center">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </main>
  );
}
