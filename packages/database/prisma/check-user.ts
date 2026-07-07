import { prisma } from "../src/index";

async function checkUser() {
  const user = await prisma.usuario.findFirst({
    where: { email: "gestor-pf@asa.com.br" },
  });
  
  console.log("User found:", user?.email);
  console.log("Tipo:", user?.tipo);
  console.log("Papel:", user?.papel);
  console.log("Papel type:", typeof user?.papel);
  
  await prisma.$disconnect();
}

checkUser();