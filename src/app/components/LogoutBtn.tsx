// src/app/components/LogoutBtn.tsx
'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function LogoutBtn() {
  return (
    <button
      onClick={() => signOut()}
      className="btn inline-flex justify-center items-center gap-1.5 cursor-pointer"
      type="button"
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      Salir
    </button>
  );
}
