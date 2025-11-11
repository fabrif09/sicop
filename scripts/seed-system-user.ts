// scripts/seed-system-user.ts
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Ajustá el email si tu tabla User tiene UNIQUE en email y este ya estuviera usado
  const SYSTEM_ID = 'system';
  const SYSTEM_EMAIL = 'no-reply@sicop.local';

  await prisma.user.upsert({
    where: { id: SYSTEM_ID },
    update: {
      nombre: 'Sistema',
      email: SYSTEM_EMAIL,
      role: 'ADMIN' as Role,
      isActive: true,
      isDeleted: false,
      // no seteamos passwordHash
    },
    create: {
      id: SYSTEM_ID,
      nombre: 'Sistema',
      email: SYSTEM_EMAIL,
      role: 'ADMIN' as Role,
      isActive: true,
      isDeleted: false,
      // opcional: approvedAt si tu schema lo tiene
      approvedAt: new Date(),
    },
  });

  console.log('✅ Usuario system creado/actualizado');
}

main()
  .catch((e) => {
    console.error('❌ Error seed system user:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
