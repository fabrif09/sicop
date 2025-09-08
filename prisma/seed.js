const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const email = 'admin@sicop.local';
  const password = 'admin123';
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      nombre: 'Admin SICOP',
      role: 'ADMIN',
      passwordHash: hash,
    },
  });

  console.log('Seed OK ->', email, password);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
