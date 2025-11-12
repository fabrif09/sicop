// src/app/materiales/ConfirmDeleteMaterialBtn.tsx
'use client';

export default function ConfirmDeleteMaterialBtn({
  children,
  message = '¿Seguro que querés borrar este material? Esta acción no se puede deshacer.',
}: {
  children: React.ReactNode;
  message?: string;
}) {
  return (
    <button
      type="submit"
      className="btn bg-red-600 hover:bg-red-700 w-full sm:w-auto"
      onClick={(e) => {
        if (!confirm(message)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      {children}
    </button>
  );
}
