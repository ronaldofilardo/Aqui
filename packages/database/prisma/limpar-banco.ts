import { prisma } from "../src/index";
import * as readline from "readline";

const isProduction =
  process.env.DATABASE_URL?.includes("neon.tech") ||
  process.env.DATABASE_URL?.includes("supabase") ||
  process.env.NODE_ENV === "production";

const isDryRun = process.argv.includes("--dry-run");

async function confirmar(mensagem: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`\n⚠️  ${mensagem} (digite SIM para confirmar): `, (resposta) => {
      rl.close();
      resolve(resposta.toUpperCase() === "SIM");
    });
  });
}

async function limparBanco() {
  // BLOQUEIO ABSOLUTO em produção
  if (isProduction) {
    console.error("\n🚫 OPERAÇÃO BLOQUEADA!");
    console.error("Este script NÃO pode ser executado em produção.");
    console.error("DATABASE_URL detectada:", process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***@"));
    process.exit(1);
  }

  console.log("\n⚠️  ATENÇÃO: Este script irá DELETAR dados do banco de dados!");
  console.log("Ambiente:", process.env.NODE_ENV || "não definido");
  console.log("Banco:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] || "desconhecido");

  if (isDryRun) {
    console.log("\n🔍 MODO DRY-RUN: Nenhuma alteração será feita.\n");
  } else {
    const confirmado = await confirmar(
      "Tem CERTEZA que deseja deletar comissões, metas, procedimentos, comerciais e backoffices?"
    );

    if (!confirmado) {
      console.log("\n❌ Operação cancelada pelo usuário.");
      await prisma.$disconnect();
      process.exit(0);
    }
  }

  try {
    console.log("\n🧹 Iniciando limpeza do banco de dados...\n");

    // Ordem respeitando foreign keys (filhos antes de pais)
    const operacoes = [
      { nome: "Comissões", modelo: prisma.comissaoComercial },
      { nome: "Metas", modelo: prisma.metaComercial },
      { nome: "Procedimentos PF", modelo: prisma.procedimentoPF },
      { nome: "Uploads PF", modelo: prisma.uploadPlanilhaPF },
      { nome: "Regras Comerciais", modelo: prisma.regraComercial },
      { nome: "Regras Gestor", modelo: prisma.regraGestor },
      { nome: "Comerciais", modelo: prisma.comercial },
      { nome: "Backoffices", modelo: prisma.backoffice },
    ];

    for (const op of operacoes) {
      if (isDryRun) {
        const count = await op.modelo.count();
        console.log(`🔍 [DRY-RUN] ${op.nome}: ${count} registros seriam deletados`);
      } else {
        const result = await op.modelo.deleteMany();
        console.log(`✅ ${op.nome}: ${result.count} registros deletados`);
      }
    }

    await prisma.$disconnect();

    if (isDryRun) {
      console.log("\n🔍 [DRY-RUN] Nenhum dado foi alterado.");
    } else {
      console.log("\n✅ Limpeza concluída com sucesso!");
    }
  } catch (error) {
    console.error("❌ Erro ao limpar banco:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

limparBanco();
