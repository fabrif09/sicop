export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/proyectos/:path*',
    '/api/upload/:path*',
    '/api/files/:path*',
    // agregar más rutas privadas si aparecen
  ],
};
