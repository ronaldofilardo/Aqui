import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Admin
  const senhaAdmin = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "admin@asa.com" },
    update: { senhaHash: senhaAdmin, senhaTemporaria: false },
    create: {
      nome: "Administrador",
      email: "admin@asa.com",
      senhaHash: senhaAdmin,
      tipo: "ADMIN",
      papel: null,
      senhaTemporaria: false,
    },
  });

  // Gestor PF
  const senhaGestorPf = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "gestor-pf@asa.com" },
    update: {
      senhaHash: senhaGestorPf,
      senhaTemporaria: false,
      tipo: "GESTOR",
      papel: "GESTOR_PF",
    },
    create: {
      nome: "Gestor Pessoa Física",
      email: "gestor-pf@asa.com",
      senhaHash: senhaGestorPf,
      tipo: "GESTOR",
      papel: "GESTOR_PF",
      senhaTemporaria: false,
    },
  });

  const gestorPfUsuario = await prisma.usuario.findUnique({
    where: { email: "gestor-pf@asa.com" },
  });
  if (gestorPfUsuario) {
    await prisma.gestorPF.upsert({
      where: { usuarioId: gestorPfUsuario.id },
      update: { cpf: "12345678901" },
      create: {
        usuarioId: gestorPfUsuario.id,
        nome: "Gestor PF",
        cpf: "12345678901",
        percentualComissaoDefault: 5.0,
        percentualComissaoMax: 100.0,
      },
    });
  }

  // Gestor PJ
  const senhaGestorPj = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "gestor-pj@asa.com" },
    update: {
      senhaHash: senhaGestorPj,
      senhaTemporaria: false,
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
    },
    create: {
      nome: "Gestor Pessoa Jurídica",
      email: "gestor-pj@asa.com",
      senhaHash: senhaGestorPj,
      tipo: "GESTOR",
      papel: "GESTOR_PJ",
      senhaTemporaria: false,
    },
  });

  // Consultor
  const senhaConsultor = await hash("123456", 12);
  const consultorUsuario = await prisma.usuario.upsert({
    where: { email: "consultor@asa.com" },
    update: { senhaHash: senhaConsultor, senhaTemporaria: false },
    create: {
      nome: "Consultor",
      email: "consultor@asa.com",
      senhaHash: senhaConsultor,
      tipo: "CONSULTOR",
      papel: null,
      senhaTemporaria: false,
    },
  });

  const consultorRecord = await prisma.consultor.upsert({
    where: { usuarioId: consultorUsuario.id },
    update: { cpf: "12345678903" },
    create: {
      usuarioId: consultorUsuario.id,
      cpf: "12345678903",
    },
  });

  // Estabelecimento 1: Churrascaria Gaúcha
  const estab1 = await prisma.estabelecimento.upsert({
    where: { id: "9103241c-60e7-45a0-87eb-f12f2588cf6c" },
    update: {},
    create: {
      id: "9103241c-60e7-45a0-87eb-f12f2588cf6c",
      nomeFantasia: "Churrascaria Gaúcha",
      razaoSocial: "CG ltda",
      cnpj: "41.877.277/0001-84",
      endereco: "rua da churras 123",
      cidade: "ctba",
      estado: "PR",
      telefone: "4133455220",
      status: "ATIVO",
      consultorId: consultorRecord.id,
      bancoNome: "Itaú",
      agencia: "341",
      conta: "43433242342",
      pixTipo: "CPF",
      pixChave: "53051173991",
    },
  });

  // Usuario Estabelecimento 1
  const senhaEstab1 = await hash("123456", 12);
  await prisma.usuarioEstabelecimento.upsert({
    where: { email: "gaucha@gmail.com" },
    update: { senhaHash: senhaEstab1, senhaTemporaria: false },
    create: {
      nome: "Churrascaria Gaúcha",
      email: "gaucha@gmail.com",
      senhaHash: senhaEstab1,
      ativo: true,
      senhaTemporaria: false,
      estabelecimentoId: estab1.id,
    },
  });

  // Estabelecimento 2: Barbearia do Zé
  const estab2 = await prisma.estabelecimento.upsert({
    where: { id: "edd3af11-b0bf-4a18-934d-c1babb4007eb" },
    update: {},
    create: {
      id: "edd3af11-b0bf-4a18-934d-c1babb4007eb",
      nomeFantasia: "Barbearia do Zé",
      razaoSocial: "BdZ ltda",
      cnpj: "94.566.679/0001-24",
      endereco: "hair st 123",
      cidade: "ctba",
      estado: "PR",
      telefone: "41992524550",
      status: "ATIVO",
      consultorId: consultorRecord.id,
      bancoNome: "Itaú",
      agencia: "546",
      conta: "564654654",
      pixTipo: "CPF",
      pixChave: "04703084945",
    },
  });

  // Usuario Estabelecimento 2
  const senhaEstab2 = await hash("123456", 12);
  await prisma.usuarioEstabelecimento.upsert({
    where: { email: "barbearia@asa.com" },
    update: { senhaHash: senhaEstab2, senhaTemporaria: false },
    create: {
      nome: "Barbearia do Zé",
      email: "barbearia@asa.com",
      senhaHash: senhaEstab2,
      ativo: true,
      senhaTemporaria: false,
      estabelecimentoId: estab2.id,
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
