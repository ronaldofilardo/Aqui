import { prisma } from "@asa/database";

async function main() {
  console.log("🔍 Verificando procedimentos para distribuição...\n");

  // Buscar gestor PF
  const gestor = await prisma.gestorPF.findFirst({
    include: {
      ciclosPontos: {
        where: {
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      },
    },
  });

  if (!gestor) {
    console.log("❌ Nenhum gestor PF encontrado");
    return;
  }

  console.log(`👤 Gestor: ${gestor.nome}`);
  console.log(`📅 Ciclos vigentes: ${gestor.ciclosPontos.length}`);
  
  if (gestor.ciclosPontos.length === 0) {
    console.log("  ⚠️  Nenhum ciclo vigente!");
    return;
  }

  const ciclo = gestor.ciclosPontos[0];
  console.log(`  - ${ciclo.nome} (${ciclo.status})`);
  console.log(`    Período: ${ciclo.inicioAcumuloEm.toLocaleDateString("pt-BR")} a ${ciclo.fimAcumuloEm.toLocaleDateString("pt-BR")}`);

  // Buscar procedimentos do gestor
  const procedimentos = await prisma.procedimentoPF.findMany({
    where: {
      parceiro: {
        gestorPfId: gestor.id,
      },
      parceiroId: { not: null },
    },
    include: {
      parceiro: {
        select: { nome: true, cpf: true },
      },
    },
    orderBy: { dataReferencia: "desc" },
  });

  console.log(`\n📋 Total de procedimentos: ${procedimentos.length}`);

  // Verificar quais já têm pontos distribuídos
  const movimentacoes = await prisma.movimentacaoPontos.findMany({
    where: {
      cicloPontosId: ciclo.id,
      origem: "PRODUCAO_IMPORTADA",
    },
    select: {
      referenciaProcedimentoId: true,
      quantidade: true,
      parceiro: { select: { nome: true } },
    },
  });

  console.log(`💰 Movimentações no ciclo: ${movimentacoes.length}`);

  console.log("\n📊 Procedimentos para distribuir:");
  for (const proc of procedimentos) {
    const temPonto = movimentacoes.find(m => m.referenciaProcedimentoId === proc.id);
    console.log(`  - ${proc.paciente} | ${proc.procedimento.substring(0, 40)}...`);
    console.log(`    Parceiro: ${proc.parceiro.nome}`);
    console.log(`    Valor: R$ ${proc.totalPago}`);
    console.log(`    Data: ${proc.dataReferencia.toLocaleDateString("pt-BR")}`);
    console.log(`    Pontos: ${temPonto ? `✅ ${temPonto.quantidade}` : '❌ NÃO DISTRIBUÍDO'}`);
    console.log("");
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