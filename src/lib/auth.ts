// src/lib/auth.ts
import { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // opcional: duración de la sesión en segundos (ej: 2 horas)
    maxAge: 60 * 60 * 2,
  },

  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email' },
        password: { label: 'Password', type: 'password' },
      },
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

        return {
          id: user.id,
          email: user.email,
          name: user.nombre,
          role: user.role,
        } as any;
      },
    }),
  ],

  callbacks: {
    // Guarda info extra en el JWT
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        (token as any).role = (user as any).role;
      }
      return token;
    },

    // Pasa esos datos al session.user
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub as string;
        (session.user as any).role = (token as any).role as any;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
};
