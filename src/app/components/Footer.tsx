// src/app/components/Footer.tsx

import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { mailtoLink } from "@/lib/contactLinks";

export default function Footer() {
  return (
    <footer className="bg-[#1e40afab] mt-8">
      <div className="mx-auto max-w-5xl px-4 py-6 flex flex-col items-center gap-4 text-center md:flex-row md:items-center md:justify-between md:text-left">
        {/* logo / marca */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-white flex items-center justify-center shadow-sm">
            <h1 className="font-heading font-black text-2xl bg-gradient-to-r from-blue-800 to-blue-500 bg-clip-text text-transparent leading-none">
              S
            </h1>
          </div>
          <span className="font-heading text-white font-semibold tracking-wide">
            SICOP
          </span>
        </div>

        {/* crédito autor + contacto + ayuda */}
        <div className="flex flex-col items-center md:items-end gap-1 text-xs text-gray-200 leading-relaxed">
          <div>
            Desarrollado por{" "}
            <span className="font-medium text-gray-200">Fabrizio Fasoli</span>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
            <span>Contacto:</span>
            <a
              href={mailtoLink("ffasoli9@gmail.com")}
              className="underline hover:text-white"
            >
              ffasoli9@gmail.com
            </a>
          </div>

          <div className="flex items-center gap-1">
            <HelpCircle className="h-3 w-3" aria-hidden="true" />
            <Link
              href="/manual-usuario"
              className="underline hover:text-white"
            >
              Ayuda – Manual de usuario
            </Link>
          </div>

          <div className="text-[10px] text-gray-200">
            © 2025 SICOP — Todos los derechos reservados
          </div>
        </div>
      </div>
    </footer>
  );
}
