import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senhaPadrao = await hash("123456", 12);

  // 1. Admin
  const admin = await prisma.usuario.upsert({
    where: { email: "admin@asa.com" },
    update: { senhaHash: senhaPadrao, senhaTemporaria: false },
    create: {
      nome: "Administrador",
      email: "admin@asa.com",
      senhaHash: senhaPadrao,
      tipo: "ADMIN",
      papel: null,
      senhaTemporaria: false,
    },
  });
  console.log("OK Admin:", admin.email);

  // 2. Gestor PF (Pessoa Fisica) - tipo GESTOR_PF
  const gestorPfUsuario = await prisma.usuario.upsert({
    where: { email: "gestor-pf@asa.com" },
    update: {
      senhaHash: senhaPadrao,
      senhaTemporaria: false,
      tipo: "GESTOR",
      papel: "GESTOR_PF",
    },
    create: {
      nome: "Gestor PF",
      email: "gestor-pf@asa.com",
      senhaHash: senhaPadrao,
      tipo: "GESTOR",
      papel: "GESTOR_PF",
      senhaTemporaria: false,
    },
  });
  await prisma.gestorPF.upsert({
    where: { usuarioId: gestorPfUsuario.id },
    update: { cpf: "12345678901" },
    create: {
      usuarioId: gestorPfUsuario.id,
      nome: gestorPfUsuario.nome,
      cpf: "12345678901",
    },
  });
  console.log("OK Gestor PF:", gestorPfUsuario.email, "papel=GESTOR_PF");

  // 3. Gestor PJ (Pessoa Juridica) - tipo GESTOR
  const gestorPjUsuario = await prisma.usuario.upsert({
    where: { email: "gestor-pj@asa.com" },
    update: {
      senhaHash: senhaPadrao,
      senhaTemporaria: false,
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
    },
    create: {
      nome: "Gestor PJ",
      email: "gestor-pj@asa.com",
      senhaHash: senhaPadrao,
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
      senhaTemporaria: false,
    },
  });
  console.log("OK Gestor PJ:", gestorPjUsuario.email, "papel=GESTOR_PJ");

  // 4. Consultor
  const consultorUsuario = await prisma.usuario.upsert({
    where: { email: "consultor@asa.com" },
    update: { senhaHash: senhaPadrao, senhaTemporaria: false },
    create: {
      nome: "Consultor",
      email: "consultor@asa.com",
      senhaHash: senhaPadrao,
      tipo: "CONSULTOR",
      papel: null,
      senhaTemporaria: false,
    },
  });
  await prisma.consultor.upsert({
    where: { usuarioId: consultorUsuario.id },
    update: { cpf: "12345678903" },
    create: {
      usuarioId: consultorUsuario.id,
      cpf: "12345678903",
    },
  });
  console.log("OK Consultor:", consultorUsuario.email);

  console.log("\n4 usuarios semeados com senha 123456");
  console.log("   Admin      -> /admin/usuarios");
  console.log("   Gestor PF  -> /gestor-pf/dashboard  (papel=GESTOR_PF)");
  console.log("   Gestor PJ  -> /gestor/dashboard     (papel=GESTOR_PJ)");
  console.log("   Consultor  -> /consultor/estabelecimentos");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
