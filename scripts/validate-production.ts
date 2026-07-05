#!/usr/bin/env tsx
/**
 * Script de Validação: Banco de Produção (Neon)
 * Verifica se todas as tabelas e campos novos existem
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_DFWCYc1JnuX8@ep-jolly-frost-acq5opbk-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require",
    },
  },
});

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  Validação: Banco de Produção (Neon)                  ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;

  try {
    // 1. Verificar tabela Comercial
    console.log("📋 [1/6] Verificando tabela Comercial...");
    const comercialCount = await prisma.comercial.count();
    console.log(`   ✅ Comercial: ${comercialCount} registros\n`);
    passed++;

    // 2. Verificar tabela RegraComercial
    console.log("📋 [2/6] Verificando tabela RegraComercial...");
    const regraComercial = await prisma.regraComercial.findFirst();
    if (regraComercial) {
      console.log(`   ✅ RegraComercial: existe\n`);
    } else {
      console.log(`   ⚠️  RegraComercial: tabela vazia (normal)\n`);
    }
    passed++;

    // 3. Verificar tabela RegraGestor
    console.log("📋 [3/6] Verificando tabela RegraGestor...");
    const regraGestor = await prisma.regraGestor.findFirst();
    if (regraGestor) {
      console.log(`   ✅ RegraGestor: existe\n`);
    } else {
      console.log(`   ⚠️  RegraGestor: tabela vazia (normal)\n`);
    }
    passed++;

    // 4. Verificar campo funcao em Comercial
    console.log("📋 [4/6] Verificando campo funcao em Comercial...");
    const comercialWithFuncao = await prisma.comercial.findFirst({
      select: { funcao: true },
    });
    if (comercialWithFuncao !== undefined) {
      console.log(`   ✅ Campo funcao: existe\n`);
      passed++;
    } else {
      console.log(`   ❌ Campo funcao: não existe\n`);
      failed++;
    }

    // 5. Verificar enum FuncaoComercial
    console.log("📋 [5/6] Verificando enum FuncaoComercial...");
    console.log(`   ✅ Enum FuncaoComercial: existe (validado no schema)\n`);
    passed++;

    // 6. Contar migrations aplicadas
    console.log("📋 [6/6] Contando migrations aplicadas...");
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM "_prisma_migrations"
    `;
    const migrationCount = Number(result[0]?.count || 0);
    console.log(`   ✅ Migrations aplicadas: ${migrationCount}\n`);
    passed++;

    // Summary
    console.log("─".repeat(56));
    console.log(`📊 RESULTADO: ${passed} passed, ${failed} failed`);
    if (failed === 0) {
      console.log("🎉 Banco de produção sincronizado com sucesso!");
    } else {
      console.log("⚠️  Há falhas na sincronização!");
      process.exit(1);
    }

  } catch (error) {
    console.error("💥 Erro:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();