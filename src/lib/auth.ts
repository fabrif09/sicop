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
      credentials: { email: { label: 'Email' }, password: { label: 'Password', type: 'password' } },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) {
          throw new Error('Email o contraseña incorrectos');
        }

        const user = await prisma.user.findUnique({
          where: { email: creds.email },
          select: {
            id: true,
            email: true,
            nombre: true,
            role: true,
            passwordHash: true,
            isActive: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error('Email o contraseña incorrectos');
        }

        if (!user.isActive) {
          throw new Error('Tu cuenta aún no fue activada por un profesor/admin');
        }

        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) {
          throw new Error('Email o contraseña incorrectos');
        }

        return { id: user.id, email: user.email, name: user.nombre, role: user.role } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        (token as any).role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).role = (token as any).role as any;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
};
