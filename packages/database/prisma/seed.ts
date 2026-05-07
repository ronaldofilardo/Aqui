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
      senhaTemporaria: false,
    },
  });

  // Gestor
  const senhaGestor = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "gestor@asa.com" },
    update: { senhaHash: senhaGestor, senhaTemporaria: false },
    create: {
      nome: "Gestor",
      email: "gestor@asa.com",
      senhaHash: senhaGestor,
      tipo: "GESTOR",
      senhaTemporaria: false,
    },
  });

  // Consultor
  const senhaConsultor = await hash("123456", 12);
  const consultorUsuario = await prisma.usuario.upsert({
    where: { email: "consultor@asa.com" },
    update: { senhaHash: senhaConsultor, senhaTemporaria: false },
    create: {
      nome: "Consultor Teste",
      email: "consultor@asa.com",
      senhaHash: senhaConsultor,
      tipo: "CONSULTOR",
      senhaTemporaria: false,
    },
  });

  // Cria registro Consultor e captura o ID (diferente do ID do Usuario)
  const consultorRecord = await prisma.consultor.upsert({
    where: { usuarioId: consultorUsuario.id },
    update: {},
    create: {
      usuarioId: consultorUsuario.id,
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
