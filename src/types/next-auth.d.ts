import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "PROF" | "ALUMNO";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "PROF" | "ALUMNO";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "ADMIN" | "PROF" | "ALUMNO";
  }
}
