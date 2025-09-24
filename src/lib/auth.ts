import { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: creds.email } });
        if (!user || !user.passwordHash) return null;
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;
        // devolvemos id y role para que el JWT los capture
        return { id: user.id, email: user.email, name: user.nombre, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // al iniciar sesión, user viene con id/role -> los guardamos en el token
      if (user) {
        token.sub = (user as any).id;         // <-- id estándar en JWT
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      // copiamos id/role del JWT a la session para leerlos en server actions
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).role = (token as any).role as any;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
};
