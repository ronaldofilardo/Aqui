import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin
  const senhaAdmin = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "admin@asa.com" },
    update: { senhaHash: senhaAdmin },
    create: {
      nome: "Administrador",
      email: "admin@asa.com",
      senhaHash: senhaAdmin,
      tipo: "ADMIN",
    },
  });

  // Gestor
  const senhaGestor = await hash("123456", 12);
  const gestor = await prisma.usuario.upsert({
    where: { email: "gestor@asa.com" },
    update: { senhaHash: senhaGestor },
    create: {
      nome: "Gestor",
      email: "gestor@asa.com",
      senhaHash: senhaGestor,
      tipo: "GESTOR",
    },
  });



  console.log("✅ Seed executado com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
