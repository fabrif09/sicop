// src/app/components/Header.tsx
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import HeaderClient from './HeaderClient';

export default async function Header() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role as 'ADMIN' | 'PROF' | 'ALUMNO' | undefined;
  const loggedIn = !!session?.user;

  // 🔹 datos del usuario para el enlace de perfil
  let userId = (session?.user as any)?.id as string | undefined;
  let userName = (session?.user as any)?.name as string | undefined;

  if ((!userId || !userName) && session?.user?.email) {
    const u = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, nombre: true },
    });
    if (u) {
      userId = u.id;
      userName = userName ?? u.nombre;
    }
  }

  // datos para badges
  const [pendingUsers, pendingPropuestas] = await Promise.all([
    prisma.user.count({ where: { isActive: false } }),
    prisma.proyecto.count({ where: { estado: 'PROPUESTO', isActive: true } }),
  ]);

  // Armamos las entradas de navegación según rol
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
        badgeCount: role === 'PROF' ? pendingUsers : 0,
      },
    ];

    if (role === 'ADMIN' || role === 'PROF') {
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
      userId={userId}
      userName={userName}
    />
  );
}
