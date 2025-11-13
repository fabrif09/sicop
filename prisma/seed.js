// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Datos del admin por defecto
  const email = 'admin@sicop.local';
  const password = 'admin123';
  const nombre = 'Administrador SICOP';

  // Generar hash seguro de la contraseña
  const hash = await bcrypt.hash(password, 10);

  // Crear o actualizar el admin
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hash,
      isActive: true,
      approvedAt: new Date(),
      role: 'ADMIN',
    },
    create: {
      email,
      nombre,
      passwordHash: hash,
      role: 'ADMIN',
      isActive: true,
      approvedAt: new Date(),
    },
  });

  console.log('✅ Admin creado correctamente:');
  console.log('   Email:', email);
  console.log('   Password:', password);
}

main()
  .catch((e) => {
    console.error('❌ Error al ejecutar el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
