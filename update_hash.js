const { hash } = require('bcryptjs');

(async () => {
  const password = 'Irys2026*';
  const hashedPassword = await hash(password, 12);
  console.log(hashedPassword);
  console.log('---HASH_END---');

  const { PrismaClient } = require('@asa/database');

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://neondb_owner:npg_DFWCYc1JnuX8@ep-jolly-frost-acq5opbk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
      }
    }
  });

  const user = await prisma.usuario.update({
    where: { email: 'irys@acessosaude.com.br' },
    data: { senhaHash: hashedPassword }
  });

  console.log('Updated:', user.email);
  await prisma.$disconnect();
})();