// src/app/layout.tsx
import './globals.css';
import type { Metadata } from 'next';
import Providers from './providers';
import Header from './components/Header';
import Footer from './components/Footer';

export const metadata: Metadata = {
  title: 'SICOP',
  description: 'Sistema de gestión de proyectos finales',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="width-auto min-h-screen flex flex-col">
        <Providers>
          <Header />
          <main className="flex-1 mx-auto max-w-[90%] px-4 py-6">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
