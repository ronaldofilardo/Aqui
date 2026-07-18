#!/usr/bin/env tsx
/**
 * E2E Test: Função Comercial e Regras
 * Testa o cadastro de comercial com função e as regras de comissão
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

function gerarCPFValido(): string {
  const rand = (n: number) => Math.floor(Math.random() * n);
  const n1 = rand(10), n2 = rand(10), n3 = rand(10);
  const n4 = rand(10), n5 = rand(10), n6 = rand(10);
  const n7 = rand(10), n8 = rand(10), n9 = rand(10);
  
  let sum = n1*10 + n2*9 + n3*8 + n4*7 + n5*6 + n6*5 + n7*4 + n8*3 + n9*2;
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  sum = n1*11 + n2*10 + n3*9 + n4*8 + n5*7 + n6*6 + n7*5 + n8*4 + n9*3 + d1*2;
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  E2E: Função Comercial e Regras                       ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;

  try {
    // 1. Criar GestorPF
    console.log("📋 [1/5] Criando GestorPF...");
    const gestorUsuario = await prisma.usuario.create({
      data: {
        nome: "Gestor Teste",
        email: `gestor-${unique()}@e2e.test`,
        senhaHash: await hash("x", 4),
        tipo: "GERENCIA",
      },
    });
    const gestorPf = await prisma.gestorPF.create({
      data: {
        usuarioId: gestorUsuario.id,
        nome: "Gestor Teste",
        cpf: gerarCPFValido(),
      },
    });
    console.log(`   ✅ GestorPF criado: ${gestorPf.id}\n`);
    passed++;

    // 2. Criar Comercial com função
    console.log("📋 [2/5] Criando Comercial com função...");
    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: "Comercial Teste",
        email: `comercial-${unique()}@e2e.test`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
        senhaTemporaria: true,
      },
    });
    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        nome: "Comercial Teste",
        cpf: gerarCPFValido(),
        gestorPfId: gestorPf.id,
        funcao: "GERENTE_CIRE",
        percentualComissao: 0,
      },
    });
    if (comercial.funcao === "GERENTE_CIRE") {
      console.log(`   ✅ Comercial criado com função: ${comercial.funcao}\n`);
      passed++;
    } else {
      console.log(`   ❌ Função não salva corretamente\n`);
      failed++;
    }

    // 3. Criar Regras Comerciais
    console.log("📋 [3/5] Criando Regras Comerciais...");
    const regraComercial = await prisma.regraComercial.create({
      data: {
        gestorPfId: gestorPf.id,
        cartaoAcessoSaude: 10.5,
        cireAtivo: 8.0,
        cireReceptivo: 7.5,
        franchisingAcesso: 6.0,
        franchisingCartao: 5.5,
        unidade: 4.0,
      },
    });
    if (Number(regraComercial.cartaoAcessoSaude) === 10.5) {
      console.log(`   ✅ Regras Comerciais criadas\n`);
      passed++;
    } else {
      console.log(`   ❌ Regras Comerciais não salvas\n`);
      failed++;
    }

    // 4. Criar Regras Gestores
    console.log("📋 [4/5] Criando Regras Gestores...");
    const regraGestor = await prisma.regraGestor.create({
      data: {
        gestorPfId: gestorPf.id,
        gerenteCire: 15.0,
        supervisorAtivo: 12.0,
        supervisorReceptivo: 11.0,
        supervisorFranquia: 10.0,
        supervisorAtendimento: 9.0,
        gerenteAtendimento: 8.0,
        supervisorComercial: 7.0,
      },
    });
    if (Number(regraGestor.gerenteCire) === 15.0) {
      console.log(`   ✅ Regras Gestores criadas\n`);
      passed++;
    } else {
      console.log(`   ❌ Regras Gestores não salvas\n`);
      failed++;
    }

    // 5. Verificar relações
    console.log("📋 [5/5] Verificando relações...");
    const gestorComRelacoes = await prisma.gestorPF.findUnique({
      where: { id: gestorPf.id },
      include: {
        comerciais: true,
        regraComercial: true,
        regraGestor: true,
      },
    });
    if (
      gestorComRelacoes?.comerciais.length === 1 &&
      gestorComRelacoes?.regraComercial &&
      gestorComRelacoes?.regraGestor
    ) {
      console.log(`   ✅ Todas as relações verificadas\n`);
      passed++;
    } else {
      console.log(`   ❌ Relações não verificadas\n`);
      failed++;
    }

    // Cleanup
    await prisma.regraGestor.delete({ where: { gestorPfId: gestorPf.id } });
    await prisma.regraComercial.delete({ where: { gestorPfId: gestorPf.id } });
    await prisma.comercial.delete({ where: { id: comercial.id } });
    await prisma.usuario.delete({ where: { id: comercialUsuario.id } });
    await prisma.gestorPF.delete({ where: { id: gestorPf.id } });
    await prisma.usuario.delete({ where: { id: gestorUsuario.id } });

    // Summary
    console.log("─".repeat(56));
    console.log(`📊 RESULTADO: ${passed} passed, ${failed} failed`);
    if (failed === 0) {
      console.log("🎉 Todos os testes passaram!");
    } else {
      console.log("⚠️  Há falhas!");
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