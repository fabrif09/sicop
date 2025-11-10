// src/app/admin/usuarios/serverActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Role, DocTipo, AuditAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function requireStaff() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!role || !['ADMIN', 'PROF'].includes(role)) {
    throw new Error('No autorizado');
  }
}

/* ─────────────── APROBAR USUARIO ─────────────── */
export async function aprobarUsuario(formData: FormData) {
  await requireStaff();
  const id = String(formData.get('id') || '');
  if (!id) throw new Error('ID requerido');

  await prisma.user.update({
    where: { id },
    data: { isActive: true, approvedAt: new Date() },
  });

  revalidatePath('/admin/usuarios');
}

/* ─────────────── RECHAZAR USUARIO ─────────────── */
export async function rechazarUsuario(formData: FormData) {
  await requireStaff();
  const id = String(formData.get('id') || '');
  if (!id) throw new Error('ID requerido');

  await prisma.user.delete({ where: { id } });
  revalidatePath('/admin/usuarios');
}

/* ─────────────── REGISTRAR DOCUMENTO PARA PROYECTO ─────────────── */
export async function registrarDocumentoParaProyecto(formData: FormData) {
  await requireStaff();

  const proyectoId = String(formData.get('proyectoId') ?? '');
  const url        = String(formData.get('key') ?? '');    // path S3/MinIO
  const mime       = String(formData.get('mime') ?? '');
  const sizeStr    = String(formData.get('size') ?? '0');

  // normalizamos el tipo recibido a enum DocTipo
  const tipoRaw = String(formData.get('tipo') ?? 'FINAL').toUpperCase() as keyof typeof DocTipo;
  const tipo: DocTipo = DocTipo[tipoRaw] ?? DocTipo.PDF_FINAL;

  if (!proyectoId || !url || !mime) {
    throw new Error('Datos de documento incompletos');
  }

  const size = Number(sizeStr) || 0;

  // Traemos el owner del proyecto para registrar al alumno como "uploader"
  const proyecto = await prisma.proyecto.findUnique({
    where: { id: proyectoId },
    select: { ownerId: true },
  });
  if (!proyecto) throw new Error('Proyecto no encontrado');

  // Creamos el documento usando el enum real (no string)
  await prisma.documento.create({
    data: {
      proyectoId,
      url,     // guardás el path en tu bucket (antes llamado key)
      mime,
      size,
      tipo,    // <- ahora es DocTipo
      uploadedById: proyecto.ownerId, // figura como subido por el alumno
    },
  });

  revalidatePath('/proyectos');
  revalidatePath(`/proyectos/${proyectoId}`);
  return { ok: true };
}

/* ─────────────── CREAR USUARIO MANUAL (+ opcional PROYECTO) ─────────────── */
export async function crearUsuarioManual(formData: FormData) {
  const session = await getServerSession(authOptions);
  const viewerRole = (session?.user as any)?.role as Role | undefined;
  if (!viewerRole || !['ADMIN', 'PROF'].includes(viewerRole)) {
    throw new Error('No autorizado');
  }

  const nombre      = String(formData.get('nombre') ?? '').trim();
  const dni         = String(formData.get('dni') ?? '').trim();
  const celular     = String(formData.get('celular') ?? '').trim();
  const emailRaw    = String(formData.get('email') ?? '').trim();
  const rolRaw      = String(formData.get('role') ?? '').trim().toUpperCase();
  const egresadoRaw = String(formData.get('egresado') ?? '').trim();
  const fechaStr    = String(formData.get('fechaRindio') ?? '').trim();
  const notaStr     = String(formData.get('nota') ?? '').trim();
  const passwordRaw = String(formData.get('password') ?? '').trim();

  const projectTitulo           = String(formData.get('projectTitulo') ?? '').trim();
  const projectDescripcion      = String(formData.get('projectDescripcion') ?? '').trim();
  const projectFuncionalidades  = String(formData.get('projectFuncionalidades') ?? '').trim();
  const projectAnioStr          = String(formData.get('projectAnio') ?? '').trim();
  const projectFechaCargaStr    = String(formData.get('projectFechaCarga') ?? '').trim();

  if (!nombre) throw new Error('El nombre es obligatorio');

  let role: Role = 'ALUMNO';
  if (viewerRole === 'ADMIN' && ['ADMIN','PROF','ALUMNO'].includes(rolRaw)) {
    role = rolRaw as Role;
  }

  const email =
    emailRaw && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : undefined;

  const dataUser: any = {
    nombre,
    isActive: true,
    role,
  };
  if (dni)     dataUser.dni = dni;
  if (celular) dataUser.celular = celular;
  if (email)   dataUser.email = email;

  if (passwordRaw) {
    dataUser.passwordHash = await bcrypt.hash(passwordRaw, 12);
  }

  if (role === 'ALUMNO') {
    const egresado = egresadoRaw === 'true';
    dataUser.egresado = egresado;

    if (egresado) {
      if (fechaStr) {
        const d = new Date(fechaStr);
        if (Number.isNaN(d.getTime())) throw new Error('Fecha rendida inválida');
        dataUser.fechaRindio = d;
      }
      if (notaStr) {
        const n = parseInt(notaStr, 10);
        if (Number.isNaN(n) || n < 0 || n > 10) throw new Error('Nota inválida (0-10)');
        dataUser.nota = n;
      }
    } else {
      dataUser.fechaRindio = null;
      dataUser.nota = null;
    }
  } else {
    dataUser.egresado = false;
    dataUser.fechaRindio = null;
    dataUser.nota = null;
  }

  try {
    if (dataUser.dni) {
      const existsDni = await prisma.user.findUnique({ where: { dni: dataUser.dni } });
      if (existsDni) throw new Error(`Ya existe un usuario con el DNI ${dataUser.dni}`);
    }
    if (dataUser.email) {
      const existsEmail = await prisma.user.findUnique({ where: { email: dataUser.email } });
      if (existsEmail) throw new Error(`Ya existe un usuario con el email ${dataUser.email}`);
    }

    const user = await prisma.user.create({ data: dataUser });

    let proyectoId: string | null = null;

    const quiereProyecto =
      role === 'ALUMNO' &&
      (projectTitulo || projectDescripcion || projectFuncionalidades);

    if (quiereProyecto) {
      const titulo          = projectTitulo || '(sin título)';
      const descripcion     = projectDescripcion || '';
      const funcionalidades = projectFuncionalidades
        ? projectFuncionalidades.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const alumnoNombre    = user.nombre;
      const alumnoEmail     = user.email ?? '';
      const anio            = projectAnioStr ? parseInt(projectAnioStr, 10) : new Date().getFullYear();
      const fechaCarga      = projectFechaCargaStr ? new Date(projectFechaCargaStr) : new Date();

      const textoIndexado = [
        titulo,
        descripcion,
        funcionalidades.join(' '),
        alumnoNombre,
        alumnoEmail,
      ]
        .join(' ')
        .toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .trim();

      const proyecto = await prisma.proyecto.create({
        data: {
          titulo,
          descripcion,
          funcionalidades,
          alumnoNombre,
          alumnoEmail,
          anio,
          fechaCarga,
          ownerId: user.id,
          textoIndexado,
        },
        select: { id: true },
      });

      proyectoId = proyecto.id;
    }

    revalidatePath('/admin/usuarios');
    return { ok: true, userId: user.id, proyectoId };

  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new Error('El DNI o email ya están registrados');
    }
    throw err;
  }
}

/* ─────────────── ELIMINAR USUARIO (ADMIN, soft-delete + audit) ─────────────── */
export async function eliminarUsuario(formData: FormData) {
  const session = await getServerSession(authOptions);
  const actorId = (session?.user as any)?.id as string | undefined;
  const actorRole = (session?.user as any)?.role as Role | undefined;

  if (!actorId || actorRole !== 'ADMIN') {
    throw new Error('No autorizado');
  }

  const id = String(formData.get('id') || '');
  const motivo = String(formData.get('motivo') || '').trim();

  if (!id) throw new Error('ID requerido');
  if (!motivo || !/\S/.test(motivo)) throw new Error('Motivo obligatorio');

  // No permitir auto-eliminarse
  if (id === actorId) throw new Error('No podés eliminar tu propio usuario');

  // Traer target para validar y loguear datos
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, isDeleted: true },
  });
  if (!target) throw new Error('Usuario inexistente');
  if (target.isDeleted) throw new Error('El usuario ya está eliminado');
  // Evitar eliminar otro ADMIN (ajustá esta regla si querés permitirlo)
  if (target.role === 'ADMIN') throw new Error('No se puede eliminar un ADMIN');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: target.id },
      data: {
        isDeleted: true,
        isActive: false,
        deletedAt: new Date(),
        deletedById: actorId,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: AuditAction.ELIMINAR_USUARIO,
        userId: actorId,
        targetUserId: target.id,
        metadata: {
          motivo,
          targetEmail: target.email,
          targetRole: target.role,
        },
      },
    }),
  ]);

  revalidatePath('/admin/usuarios');
}
