import { prisma } from "@asa/database";

async function main() {
  console.log("🔍 Verificando procedimentos para distribuição...\n");

  // Buscar backoffice
  const backoffice = await prisma.backoffice.findFirst({
    include: {
      ciclosPontos: {
        where: {
          OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
        },
      },
    },
  });

  if (!backoffice) {
    console.log("❌ Nenhum backoffice encontrado");
    return;
  }

  console.log(`👤 Backoffice: ${backoffice.nome}`);
  console.log(`📅 Ciclos vigentes: ${backoffice.ciclosPontos.length}`);
  
  if (backoffice.ciclosPontos.length === 0) {
    console.log("  ⚠️  Nenhum ciclo vigente!");
    return;
  }

  const ciclo = backoffice.ciclosPontos[0];
  console.log(`  - ${ciclo.nome} (${ciclo.status})`);
  console.log(`    Período: ${ciclo.inicioAcumuloEm.toLocaleDateString("pt-BR")} a ${ciclo.fimAcumuloEm.toLocaleDateString("pt-BR")}`);

  // Buscar procedimentos do backoffice
  const liderancas = await prisma.lideranca.findMany({
    where: { backofficeId: backoffice.id },
    include: {
      comerciais: { include: { parceiros: { select: { id: true } } } },
      gestores: { include: { parceiros: { select: { id: true } } } }
    }
  });

  const parceiroIds = [
    ...liderancas.flatMap(l => l.comerciais.flatMap(c => c.parceiros.map(p => p.id))),
    ...liderancas.flatMap(l => l.gestores.flatMap(g => g.parceiros.map(p => p.id)))
  ];

  const procedimentos = await prisma.procedimentoPF.findMany({
    where: {
      parceiroId: parceiroIds.length > 0 ? { in: parceiroIds } : undefined,
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
    console.log(`    Parceiro: ${proc.parceiro!.nome}`);
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