// src/app/components/HeaderClient.tsx
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
  CircleUser,
  BookUser,
  HelpCircle, // 👈 AGREGADO
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
  userId,
  userName,
  userRole,
}: {
  navItems: NavItem[];
  loggedIn: boolean;
  showLogout: boolean;
  headerClassName: string;
  userId?: string;
  userName?: string;
  userRole?: 'ADMIN' | 'PROF' | 'ALUMNO';
}) {
  const [open, setOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // NUEVO: estado con contadores en vivo
  const [liveCounts, setLiveCounts] = useState<{
    pendingUsers: number;
    pendingPropuestas: number;
  } | null>(null);

  function openMenu() {
    setOpen(true);
  }
  function closeMenu() {
    setAnimateIn(false);
    setTimeout(() => setOpen(false), 200);
  }

  useEffect(() => {
    if (open) requestAnimationFrame(() => setAnimateIn(true));
    else setAnimateIn(false);
  }, [open]);

  // NUEVO: polling + refresh al recuperar foco
  useEffect(() => {
    if (!loggedIn || !(userRole === 'ADMIN' || userRole === 'PROF')) return;

    let intervalId: number | null = null;

    const fetchCounts = async () => {
      try {
        const res = await fetch('/api/badges', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLiveCounts({
            pendingUsers: data.pendingUsers ?? 0,
            pendingPropuestas: data.pendingPropuestas ?? 0,
          });
        }
      } catch {
        // silencioso
      }
    };

    // primer tiro + cada 8 s + al volver el foco
    fetchCounts();
    intervalId = window.setInterval(fetchCounts, 8000);
    const onFocus = () => fetchCounts();
    window.addEventListener('focus', onFocus);

    return () => {
      if (intervalId) clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [loggedIn, userRole]);

  const Badge = ({ count }: { count?: number }) =>
    count && count > 0 ? (
      <span className="ml-1 inline-flex min-w-[1.1rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold leading-4 text-white">
        {count}
      </span>
    ) : null;

  const getIcon = (label: string) => {
    if (label === 'Material Cátedra') return Files;
    if (label === 'Proyectos') return FolderKanban;
    if (label === 'Mi proyecto') return FolderKanban;
    if (label === 'Alumnos') return GraduationCap;
    if (label === 'Usuarios') return Users;
    if (label === 'Ingresar') return LogIn;
    if (label === 'Mi perfil') return CircleUser;
    if (label === 'Profes de la cátedra') return BookUser;
    return null;
  };

  // función que decide el badge actual
  const currentBadgeFor = (item: NavItem) => {
    if (!liveCounts) return item.badgeCount;

    if (item.label === 'Proyectos') return liveCounts.pendingPropuestas;
    if (item.label === 'Usuarios') return liveCounts.pendingUsers;
    if (item.label === 'Alumnos' && userRole === 'PROF')
      return liveCounts.pendingUsers;

    return item.badgeCount;
  };

  return (
    <>
      {/* TOP BAR */}
      <header className={headerClassName}>
        <div className="mx-auto max-w-5xl px-4 h-14 flex items-center justify-between">
          {/* LEFT: burger + logo */}
          <div className="flex items-center gap-25">
            <button
              className="md:hidden inline-flex flex-col justify-center gap-[4px] p-2 rounded hover:bg-white/10 focus:outline-none"
              aria-label="Abrir menú"
              onClick={openMenu}
            >
              <span className="block h-[2px] w-6 bg-white rounded" />
              <span className="block h-[2px] w-6 bg-white rounded" />
              <span className="block h-[2px] w-6 bg-white rounded" />
            </button>

            <Link href="/" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-white flex items-center justify-center mr">
                <h1 className="font-heading font-black text-2xl bg-gradient-to-r from-blue-900 to-blue-500 bg-clip-text text-transparent">
                  S
                </h1>
              </div>

              <span className="font-heading tracking-wide text-white md:hidden">
                SICOP
              </span>
              <span className="font-heading tracking-wide text-white hidden lg:inline">
                SICOP
              </span>
            </Link>
          </div>

          {/* RIGHT: nav desktop */}
          <nav className="hidden md:flex items-center gap-4">
            {navItems.map((item) => {
              const Icon = getIcon(item.label);
              const badge = currentBadgeFor(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-white hover:underline inline-flex items-center gap-1.5"
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                  <Badge count={badge} />
                </Link>
              );
            })}

            {/* 👇 AGREGADO: link Manual de usuario solo si NO hay sesión (desktop) */}
            {!loggedIn && (
              <Link
                href="/manual-usuario"
                className="text-sm text-white hover:underline inline-flex items-center gap-1.5"
              >
                <HelpCircle className="h-4 w-4" />
                <span>Manual de usuario</span>
              </Link>
            )}

            {!loggedIn ? (
              <Link
                href="/login"
                className="text-white text-sm hover:underline inline-flex items-center gap-1.5"
              >
                <LogIn className="h-4 w-4" />
                Ingresar
              </Link>
            ) : (
              <>
                {userId && (
                  <Link
                    href={`/usuarios/${userId}`}
                    className="text-white text-sm hover:underline inline-flex items-center gap-1.5 max-w-[14rem]"
                    title={userName || 'Mi perfil'}
                  >
                    <CircleUser className="h-4 w-4" />
                    <span className="truncate">{userName || 'Mi perfil'}</span>
                  </Link>
                )}
                <LogoutBtn />
              </>
            )}
          </nav>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" aria-modal="true" role="dialog">
          <button
            className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
              animateIn ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={closeMenu}
            aria-label="Cerrar menú"
          />
          <aside
            className={`relative bg-white w-64 max-w-[80%] h-full shadow-xl flex flex-col transition-transform duration-200 ${
              animateIn ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
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

            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = getIcon(item.label);
                const badge = currentBadgeFor(item);
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
                    <Badge count={badge} />
                  </Link>
                );
              })}

              {loggedIn && userId && (
                <Link
                  href={`/usuarios/${userId}`}
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <CircleUser className="h-4 w-4 text-[#1e40af]" />
                    {userName || 'Mi perfil'}
                  </span>
                </Link>
              )}

              {/* 👇 AGREGADO: link Manual de usuario solo si NO hay sesión (mobile) */}
              {!loggedIn && (
                <Link
                  href="/manual-usuario"
                  onClick={closeMenu}
                  className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <HelpCircle className="h-4 w-4 text-[#1e40af]" />
                    Manual de usuario
                  </span>
                </Link>
              )}
            </nav>

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
