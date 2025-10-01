import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token: any = (req as any).nextauth?.token;
    const role = token?.role;

    // Solo STAFF puede /admin/**
    if (pathname.startsWith('/admin')) {
      if (!['ADMIN', 'PROF'].includes(role)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Bloquear listados de proyectos a ALUMNO
    // (permitimos luego /proyectos/nuevo y /proyectos/[id] pero lo validamos del lado servidor)
    const isListadoProyectos =
      pathname === '/proyectos' ||
      pathname === '/proyectos/' ||
      pathname.startsWith('/proyectos/buscar'); 

    if (isListadoProyectos && role === 'ALUMNO') {
      return NextResponse.redirect(new URL('/mi-proyecto', req.url)); // o '/'
    }

    return NextResponse.next();
  },
  {
    callbacks: { authorized: ({ token }) => !!token },
    pages: { signIn: '/login' },
  }
);

export const config = {
  matcher: [
    '/proyectos/:path*',
    '/api/upload/:path*',
    '/api/files/:path*',
    '/admin/:path*',
  ],
};
