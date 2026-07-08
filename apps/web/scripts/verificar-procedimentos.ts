import { prisma } from "@asa/database";

async function main() {
  console.log("🔍 Verificando situação dos procedimentos...\n");

  // Total de procedimentos
  const total = await prisma.procedimentoPF.count();
  console.log(`📊 Total de procedimentos: ${total}`);

  // Procedimentos com parceiro
  const comParceiro = await prisma.procedimentoPF.count({
    where: { parceiroId: { not: null } },
  });
  console.log(`✅ Com parceiro: ${comParceiro}`);

  // Procedimentos sem parceiro
  const semParceiro = await prisma.procedimentoPF.count({
    where: { parceiroId: null },
  });
  console.log(`⚠️  Sem parceiro: ${semParceiro}`);

  // Total de parceiros
  const totalParceiros = await prisma.parceiro.count();
  console.log(`👥 Total de parceiros: ${totalParceiros}`);

  // Listar parceiros e seus procedimentos
  console.log("\n📋 Parceiros e quantidade de procedimentos:");
  const parceiros = await prisma.parceiro.findMany({
    include: {
      _count: {
        select: { procedimentos: true },
      },
    },
    orderBy: { nome: "asc" },
  });

  for (const par of parceiros) {
    console.log(`  - ${par.nome} (CPF: ${par.cpf}): ${par._count.procedimentos} procedimentos`);
  }

  // Listar alguns procedimentos para conferência
  console.log("\n📋 Amostra de procedimentos:");
  const procedimentos = await prisma.procedimentoPF.findMany({
    include: {
      parceiro: {
        select: { nome: true, cpf: true },
      },
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  for (const proc of procedimentos) {
    console.log(`  - ${proc.paciente} | CPF: ${proc.cpf} | Parceiro: ${proc.parceiro?.nome || "NÃO VINCULADO"}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });