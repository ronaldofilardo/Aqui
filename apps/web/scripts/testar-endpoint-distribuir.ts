import { prisma } from "@asa/database";

async function main() {
  console.log("🔍 Testando endpoint de distribuição...\n");

  // Simular o que o endpoint GET faz
  const gestor = await prisma.gestorPF.findFirst();
  
  if (!gestor) {
    console.log("❌ Gestor não encontrado");
    return;
  }

  console.log(`Gestor: ${gestor.nome}`);

  // Buscar ciclo vigente
  const cicloVigente = await prisma.cicloPontos.findFirst({
    where: {
      gestorPfId: gestor.id,
      OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
    },
  });

  if (!cicloVigente) {
    console.log("❌ Ciclo vigente não encontrado");
    return;
  }

  console.log(`Ciclo: ${cicloVigente.nome} (${cicloVigente.status})`);

  // Buscar produções - MESMO CÓDIGO DO ENDPOINT
  const producoes = await prisma.procedimentoPF.findMany({
    where: {
      parceiro: {
        gestorPfId: gestor.id,
      },
      parceiroId: {
        not: null,
      },
    },
    include: {
      parceiro: {
        select: {
          id: true,
          nome: true,
          cpf: true,
        },
      },
    },
    orderBy: {
      dataReferencia: "desc",
    },
  });

  console.log(`\n📋 Produções encontradas: ${producoes.length}`);

  // Buscar pontos distribuídos
  const pontosDistribuidos = await prisma.movimentacaoPontos.findMany({
    where: {
      cicloPontosId: cicloVigente.id,
      origem: "PRODUCAO_IMPORTADA",
    },
  });

  console.log(`💰 Pontos distribuídos: ${pontosDistribuidos.length}`);

  // Mapear como o endpoint faz
  const producoesComPontos = producoes.map((producao) => {
    const pontos = pontosDistribuidos.find((p) => p.referenciaProcedimentoId === producao.id);
    
    return {
      id: producao.id,
      dataProcedimento: producao.dataReferencia.toISOString(),
      procedimento: producao.procedimento,
      paciente: producao.paciente,
      totalPago: producao.totalPago?.toString() || "0",
      parceiro: producao.parceiro,
      pontosDistribuidos: pontos ? {
        id: pontos.id,
        pontos: pontos.quantidade,
        dataReferencia: pontos.criadoEm.toISOString(),
      } : null,
    };
  });

  console.log("\n📊 Produções para exibir na aba:");
  producoesComPontos.forEach((p, i) => {
    console.log(`${i + 1}. ${p.paciente} - ${p.parceiro.nome} - R$ ${p.totalPago} - ${p.pontosDistribuidos ? `✅ ${p.pontosDistribuidos.pontos} pts` : '❌ Sem pontos'}`);
  });
}

main()
  .catch((e) => {
    console.error("Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });