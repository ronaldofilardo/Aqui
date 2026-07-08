import { prisma } from "@asa/database";
import { calcularPontosDeProducao } from "../lib/pontos-utils";

async function main() {
  console.log("🔍 Simulando endpoint GET /distribuir...\n");

  // Simular requireGestorPFWithScope
  const gestor = await prisma.gestorPF.findFirst({
    include: { usuario: true },
  });

  if (!gestor) {
    console.log("❌ Gestor não encontrado");
    return;
  }

  console.log("✅ Gestor encontrado:", gestor.nome);
  console.log("   ID:", gestor.id);
  console.log("   Usuario tipo:", gestor.usuario.tipo);
  console.log("   Usuario papel:", gestor.usuario.papel);

  const gestorPfId = gestor.id;

  // Buscar ciclo vigente
  const cicloVigente = await prisma.cicloPontos.findFirst({
    where: {
      gestorPfId,
      OR: [{ status: "EM_ANDAMENTO" }, { status: "RESGATE_ABERTO" }],
    },
  });

  if (!cicloVigente) {
    console.log("❌ Ciclo vigente não encontrado");
    return;
  }

  console.log("\n✅ Ciclo encontrado:", cicloVigente.nome);
  console.log("   Status:", cicloVigente.status);
  console.log("   ID:", cicloVigente.id);

  // Buscar produções
  const producoes = await prisma.procedimentoPF.findMany({
    where: {
      parceiro: {
        gestorPfId,
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

  console.log("\n✅ Produções encontradas:", producoes.length);

  // Buscar pontos distribuídos
  const pontosDistribuidos = await prisma.movimentacaoPontos.findMany({
    where: {
      cicloPontosId: cicloVigente.id,
      origem: "PRODUCAO_IMPORTADA",
    },
  });

  console.log("✅ Pontos distribuídos no ciclo:", pontosDistribuidos.length);

  // Mapear produções
  console.log("\n📋 Detalhamento das produções:\n");
  
  for (const producao of producoes) {
    const pontos = pontosDistribuidos.find((p) => p.referenciaProcedimentoId === producao.id);
    
    let pontosPotenciais = 0;
    try {
      pontosPotenciais = await calcularPontosDeProducao(
        producao.totalPago,
        producao.dataReferencia,
        gestorPfId,
      );
    } catch (e: any) {
      console.log(`⚠️ Erro ao calcular pontos: ${e.message}`);
    }

    console.log(`📌 ${producao.paciente}`);
    console.log(`   Procedimento: ${producao.procedimento.substring(0, 50)}...`);
    console.log(`   Parceiro: ${producao.parceiro.nome}`);
    console.log(`   Total: R$ ${producao.totalPago}`);
    console.log(`   Data: ${producao.dataReferencia.toLocaleDateString("pt-BR")}`);
    console.log(`   Pontos potenciais: ${pontosPotenciais}`);
    console.log(`   Status: ${pontos ? `✅ DISTRIBUÍDO (${pontos.quantidade} pts)` : '❌ NÃO DISTRIBUÍDO'}`);
    console.log("");
  }

  console.log("\n✅ Simulação concluída!");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });