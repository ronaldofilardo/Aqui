import { prisma } from "@asa/database";
import { calcularPontosDeProducao, obterCicloVigente } from "../lib/pontos-utils";

async function main() {
  console.log("🔄 Distribuindo pontos automaticamente para teste...\n");

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

  const ciclo = gestor.ciclosPontos[0];
  console.log(`📅 Ciclo: ${ciclo.nome}`);

  // Buscar procedimentos sem pontos
  const procedimentos = await prisma.procedimentoPF.findMany({
    where: {
      parceiro: { gestorPfId: gestor.id },
      parceiroId: { not: null },
    },
    include: {
      parceiro: { select: { nome: true } },
    },
    orderBy: { dataReferencia: "desc" },
  });

  let totalDistribuido = 0;
  let totalPontos = 0;

  for (const proc of procedimentos) {
    // Verificar se já tem pontos
    const existente = await prisma.movimentacaoPontos.findFirst({
      where: {
        referenciaProcedimentoId: proc.id,
        origem: "PRODUCAO_IMPORTADA",
      },
    });

    if (existente) {
      console.log(`⏭️  ${proc.paciente}: já distribuído`);
      continue;
    }

    // Calcular pontos (usa data de referência ou data de criação)
    const dataRef = proc.dataReferencia || proc.createdAt;
    const pontos = await calcularPontosDeProducao(
      proc.totalPago,
      dataRef,
      gestor.id,
    );

    // Criar movimentação
    await prisma.movimentacaoPontos.create({
      data: {
        parceiroId: proc.parceiroId!,
        cicloPontosId: ciclo.id,
        tipo: "CREDITO",
        quantidade: pontos,
        descricao: `Pontos por produção: ${proc.procedimento.substring(0, 50)}`,
        referenciaProcedimentoId: proc.id,
        origem: "PRODUCAO_IMPORTADA",
      },
    });

    console.log(`✅ ${proc.paciente}: ${pontos} pontos (R$ ${proc.totalPago})`);
    totalDistribuido++;
    totalPontos += pontos;
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   Procedimentos distribuídos: ${totalDistribuido}`);
  console.log(`   Total de pontos: ${totalPontos}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });