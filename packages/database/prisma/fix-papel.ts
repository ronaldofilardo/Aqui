import { prisma } from "../src/index";

async function fixPapel() {
  console.log("Fixing papel for gestores...");
  
  // Update Gestor PF
const backoffice = await prisma.usuario.updateMany({
    where: { email: "backoffice@asa.com" },
    data: { papel: "BACKOFFICE" },
  });

  console.log("Updated Backoffice:", backoffice.count);
  
  // Update Gestor PJ
  const gestorPj = await prisma.usuario.updateMany({
    where: { email: "gestor-pj@asa.com.br" },
    data: { papel: "GESTOR_PJ" },
  });
  console.log("Updated Gestor PJ:", gestorPj.count);
  
  // Verify
  const userPf = await prisma.usuario.findFirst({
    where: { email: "backoffice@asa.com" },
  });
  console.log("Verified Backoffice - Papel:", userPf?.papel);
  
  const userPj = await prisma.usuario.findFirst({
    where: { email: "gestor-pj@asa.com.br" },
  });
  console.log("Verified Gestor PJ - Papel:", userPj?.papel);
  
  await prisma.$disconnect();
}

fixPapel();