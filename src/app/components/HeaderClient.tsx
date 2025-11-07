'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LogoutBtn from './LogoutBtn';
import {
  Files,
  FolderKanban,
  GraduationCap,
  Users,
  LogIn,
} from 'lucide-react';

type NavItem = {
  label: string;
  href: string;
  badgeCount?: number;
};

export default function HeaderClient({
  navItems,
  loggedIn,
  showLogout,
  headerClassName,
}: {
  navItems: NavItem[];
  loggedIn: boolean;
  showLogout: boolean;
  headerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  function openMenu() {
    setOpen(true);
  }

  function closeMenu() {
    setAnimateIn(false);
    setTimeout(() => {
      setOpen(false);
    }, 200);
  }

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        setAnimateIn(true);
      });
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  const Badge = ({ count }: { count?: number }) =>
    count && count > 0 ? (
      <span className="ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-4 text-white">
        {count}
      </span>
    ) : null;

  // Mapa de íconos según label
  const getIcon = (label: string) => {
    if (label === 'Material Cátedra') return Files;
    if (label === 'Proyectos') return FolderKanban;
    if (label === 'Alumnos') return GraduationCap;
    if (label === 'Usuarios') return Users;
    return null;
  };

  return (
    <>
      {/* TOP BAR */}
      <header className={headerClassName}>
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          {/* LEFT: burger (mobile) + logo */}
          <div className="flex items-center gap-25">
            {/* hamburger visible solo en mobile */}
            <button
              className="md:hidden inline-flex flex-col justify-center gap-[4px] p-2 rounded hover:bg-white/10 focus:outline-none"
              aria-label="Abrir menú"
              onClick={openMenu}
            >
              <span className="block h-[2px] w-6 bg-white rounded" />
              <span className="block h-[2px] w-6 bg-white rounded" />
              <span className="block h-[2px] w-6 bg-white rounded" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center mr">
                <h1 className="font-heading font-black text-2xl bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent">
                  S
                </h1>
              </div>
              <span className="font-heading tracking-wide text-white">SICOP</span>
            </Link>
          </div>

          {/* RIGHT: nav desktop */}
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => {
              const Icon = getIcon(item.label);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white hover:underline inline-flex items-center gap-1.5"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                  <Badge count={item.badgeCount} />
                </Link>
              );
            })}

            {!loggedIn ? (
              <Link
                href="/login"
                className="text-white text-sm hover:underline inline-flex items-center gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Ingresar
              </Link>
            ) : (
              <LogoutBtn />
            )}
          </nav>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
          {/* overlay */}
          <button
            className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
              animateIn ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMenu}
            aria-label="Cerrar menú"
          />

          {/* drawer con animación */}
          <aside
            className={`relative bg-white w-64 max-w-[80%] h-full shadow-xl flex flex-col transition-transform duration-200 ${
              animateIn ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* header del drawer */}
            <div className="flex items-center justify-between px-4 h-14 border-b">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-[#1e40af] flex items-center justify-center">
                  <h1 className="text-white font-heading text-xl">S</h1>
                </div>
                <span className="font-heading tracking-wide text-[#1e40af] font-semibold">
                  SICOP
                </span>
              </div>
              <button
                className="p-2 rounded hover:bg-gray-100"
                onClick={closeMenu}
                aria-label="Cerrar menú"
              >
                <span className="block h-[2px] w-5 bg-gray-800 rotate-45 translate-y-[2px]" />
                <span className="block h-[2px] w-5 bg-gray-800 -rotate-45 -translate-y-[2px]" />
              </button>
            </div>

            {/* links con íconos */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = getIcon(item.label);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {Icon && <Icon className="h-4 w-4 text-[#1e40af]" />}
                      {item.label}
                    </span>
                    <Badge count={item.badgeCount} />
                  </Link>
                );
              })}
            </nav>

            {/* footer */}
            <div className="border-t p-4">
              {!loggedIn ? (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block w-full text-center btn inline-flex items-center justify-center gap-1.5"
                >
                  <LogIn className="h-4 w-4" />
                  Ingresar
                </Link>
              ) : (
                <div className="w-full flex">
                  <div className="flex-1">
                    <LogoutBtn />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
