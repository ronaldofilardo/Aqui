import { prisma } from "@asa/database";

async function main() {
  console.log("🔍 Verificando configuração do sistema de pontos...\n");

  // Verificar ciclos
  console.log("📅 Ciclos de Pontos:");
  const ciclos = await prisma.cicloPontos.findMany({
    orderBy: { criadoEm: "desc" },
  });

  if (ciclos.length === 0) {
    console.log("  ⚠️  Nenhum ciclo encontrado!");
  } else {
    for (const ciclo of ciclos) {
      console.log(`  - ${ciclo.nome}`);
      console.log(`    Status: ${ciclo.status}`);
      console.log(`    Período: ${ciclo.inicioAcumuloEm.toLocaleDateString("pt-BR")} a ${ciclo.fimAcumuloEm.toLocaleDateString("pt-BR")}`);
      console.log(`    Periodicidade: ${ciclo.periodicidade}`);
      console.log("");
    }
  }

  // Verificar configurações
  console.log("\n⚙️  Configurações de Pontos:");
  const configs = await prisma.configuracaoPontos.findMany({
    orderBy: { vigenteDesde: "desc" },
  });

  if (configs.length === 0) {
    console.log("  ⚠️  Nenhuma configuração encontrada!");
  } else {
    for (const config of configs) {
      console.log(`  - Valor por ponto: R$ ${config.valorPorPonto}`);
      console.log(`    Tipo arredondamento: ${config.tipoArredondamento}`);
      console.log(`    Vigente desde: ${config.vigenteDesde.toLocaleDateString("pt-BR")}`);
      console.log(`    Vigente: ${!config.vigenteAte || config.vigenteAte > new Date() ? "Sim" : "Não"}`);
      console.log("");
    }
  }

  // Verificar movimentações de pontos
  console.log("\n💰 Movimentações de Pontos:");
  const movimentacoes = await prisma.movimentacaoPontos.findMany({
    include: {
      parceiro: { select: { nome: true } },
      cicloPontos: { select: { nome: true } },
    },
    orderBy: { criadoEm: "desc" },
    take: 10,
  });

  if (movimentacoes.length === 0) {
    console.log("  ⚠️  Nenhuma movimentação encontrada!");
  } else {
    for (const mov of movimentacoes) {
      console.log(`  - ${mov.parceiro.nome}: ${mov.quantidade} pontos (${mov.tipo})`);
      console.log(`    Ciclo: ${mov.cicloPontos.nome}`);
      console.log(`    Origem: ${mov.origem}`);
      console.log(`    Descrição: ${mov.descricao || "N/A"}`);
      console.log("");
    }
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