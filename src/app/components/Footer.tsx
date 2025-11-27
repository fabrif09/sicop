// src/app/components/Footer.tsx

import { mailtoLink } from "@/lib/contactLinks"

export default function Footer() {
  return (
    <footer className=" bg-[#1e40afab]  mt-8">
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

        {/* crédito autor */}
        <div className="text-xs text-gray-200 leading-relaxed">
          <div>Desarrollado por <span className="font-medium text-gray-200">Fabrizio Fasoli</span></div>
          <div>
            Contacto:{" "}
            <a 
              href="mailto:ffasoli9@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-gray-100 hover:text-white"
            >
              ffasoli9@gmail.com
            </a>
          </div>
          <div className="text-[10px] text-gray-200">
            © 2025 SICOP — Todos los derechos reservados
          </div>
        </div>
      </div>
    </footer>
  );
}
