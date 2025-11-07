// src/app/components/Header.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;
  const loggedIn = !!session?.user;

  // datos para badges
  const [pendingUsers, pendingPropuestas] = await Promise.all([
    prisma.user.count({ where: { isActive: false } }),
    prisma.proyecto.count({ where: { estado: 'PROPUESTO' } }),
  ]);

  // Armamos las entradas de navegación según rol
  // Cada item: { label, href, badgeCount? }
  let navItems: { label: string; href: string; badgeCount?: number }[] = [];

  if (role === 'ALUMNO') {
    navItems = [
      { label: 'Material Cátedra', href: '/materiales' },
      { label: 'Mi proyecto', href: '/mi-proyecto' },
    ];
  } else if (role === 'ADMIN' || role === 'PROF') {
    navItems = [
      { label: 'Material Cátedra', href: '/materiales' },
      { label: 'Proyectos', href: '/proyectos', badgeCount: pendingPropuestas },
      {
        label: 'Alumnos',
        href: '/admin/alumnos',
        // badge en Alumnos solo para PROF (pendientes de aprobar usuarios)
        badgeCount: role === 'PROF' ? pendingUsers : 0,
      },
    ];

    if (role === 'ADMIN'|| role === 'PROF') {
      navItems.push({
        label: 'Usuarios',
        href: '/admin/usuarios',
        badgeCount: pendingUsers,
      });
    }
  }

  return (
    <HeaderClient
      navItems={navItems}
      loggedIn={loggedIn}
      showLogout={loggedIn}
      headerClassName="sticky top-0 z-40 bg-[#1e40af] backdrop-blur bg-opacity-50 shadow-lg"
    />
  );
}
