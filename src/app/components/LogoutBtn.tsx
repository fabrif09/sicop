'use client';
import { signOut } from 'next-auth/react';
export default function LogoutBtn() { return <button className="border px-3 py-1" onClick={()=>signOut({ callbackUrl:'/login' })}>Salir</button>; }
