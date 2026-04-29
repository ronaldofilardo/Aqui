import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Gestor Admin
  const senhaGestor = await hash("admin123", 12);
  const gestor = await prisma.usuario.upsert({
    where: { email: "admin@asa.com.br" },
    update: {},
    create: {
      nome: "Administrador ASA",
      email: "admin@asa.com.br",
      senhaHash: senhaGestor,
      tipo: "GESTOR",
      telefone: "(11) 99999-0000",
    },
  });

  // Gestora Vanda
  const senhaVanda = await hash("123456", 12);
  await prisma.usuario.upsert({
    where: { email: "vanda@asa.com" },
    update: { senhaHash: senhaVanda },
    create: {
      nome: "Vanda",
      email: "vanda@asa.com",
      senhaHash: senhaVanda,
      tipo: "GESTOR",
    },
  });

  // Consultor Demo
  const senhaConsultor = await hash("consultor123", 12);
  const consultorUser = await prisma.usuario.upsert({
    where: { email: "consultor@asa.com.br" },
    update: {},
    create: {
      nome: "Consultor Demo",
      email: "consultor@asa.com.br",
      senhaHash: senhaConsultor,
      tipo: "CONSULTOR",
      telefone: "(11) 98888-0000",
    },
  });

  const consultor = await prisma.consultor.upsert({
    where: { usuarioId: consultorUser.id },
    update: {},
    create: {
      usuarioId: consultorUser.id,
      pixChave: "consultor@asa.com.br",
      pixTipo: "EMAIL",
      bancoNome: "Banco Demo",
      agencia: "0001",
      conta: "12345-6",
    },
  });

  // Estabelecimento Demo
  const estab = await prisma.estabelecimento.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      consultorId: consultor.id,
      nomeFantasia: "Barbearia do SR. João",
      razaoSocial: "João Barbearia LTDA",
      cnpj: "12.345.678/0001-90",
      endereco: "Rua Exemplo, 123",
      cidade: "São Paulo",
      estado: "SP",
      telefone: "(11) 97777-0000",
      email: "joao@barbearia.com",
      responsavelNome: "João da Silva",
      responsavelCpf: "123.456.789-00",
    },
  });

  // Cupom Config Demo
  await prisma.cupomConfig.upsert({
    where: { codigoCupom: "A200" },
    update: {},
    create: {
      estabelecimentoId: estab.id,
      codigoCupom: "A200",
      descricao: "Cupom Barbearia SR. João",
      criadoPor: gestor.id,
    },
  });

  console.log("✅ Seed executado com sucesso!");
  console.log("  Admin: admin@asa.com / 123456");
  console.log("  Gestor: admin@asa.com.br / admin123");
  console.log("  Gestora: vanda@asa.com / 123456");
  console.log("  Consultor: consultor@asa.com.br / consultor123");
  console.log("  Consultor CPF: 530.511.739-91 / consultor123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
