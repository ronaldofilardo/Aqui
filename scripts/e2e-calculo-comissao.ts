#!/usr/bin/env tsx
/**
 * E2E Test: Cálculo de Comissão com Regras
 * Testa o cálculo de comissão baseado em RegrasComerciais x RegrasGestores x Função
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { calcularComissaoComercial } from "../apps/web/lib/pontos-utils";

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
  console.log("║  E2E: Cálculo de Comissão com Regras                  ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  let passed = 0;
  let failed = 0;

  try {
    // 1. Setup: Criar GestorPF
    console.log("📋 [1/6] Criando GestorPF...");
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

    // 2. Criar Regras
    console.log("📋 [2/6] Criando Regras...");
    await prisma.regraComercial.create({
      data: {
        gestorPfId: gestorPf.id,
        cartaoAcessoSaude: 10.0,
        cireAtivo: 8.0,
        cireReceptivo: 7.0,
        franchisingAcesso: 6.0,
        franchisingCartao: 5.0,
        unidade: 5.0, // 5% para procedimentos de unidade
      },
    });

    await prisma.regraGestor.create({
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
    console.log(`   ✅ Regras criadas\n`);
    passed++;

    // 3. Criar Comercial com função SUPERVISOR_ATIVO
    console.log("📋 [3/6] Criando Comercial SUPERVISOR_ATIVO...");
    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: "Comercial Ativo",
        email: `comercial-ativo-${unique()}@e2e.test`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });
    const comercialAtivo = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        nome: "Comercial Ativo",
        cpf: gerarCPFValido(),
        gestorPfId: gestorPf.id,
        funcao: "SUPERVISOR_ATIVO",
      },
    });
    console.log(`   ✅ Comercial criado: ${comercialAtivo.id}\n`);
    passed++;

    // 4. Testar cálculo de comissão
    console.log("📋 [4/6] Testando cálculo de comissão...");
    const valorProcedimento = 1000; // R$ 1.000,00
    const resultado = await calcularComissaoComercial({
      comercialId: comercialAtivo.id,
      valorProcedimento,
      dataReferencia: new Date(),
    });

    // Expected:
    // RegraComercial.unidade = 5%
    // RegraGestor.supervisorAtivo = 12%
    // Comissão = 1000 × 0.05 × 0.12 = R$ 6,00
    const valorEsperado = 6.0;
    
    console.log(`   Valor Procedimento: R$ ${valorProcedimento.toFixed(2)}`);
    console.log(`   Regra Comercial (unidade): 5%`);
    console.log(`   Regra Gestor (supervisorAtivo): 12%`);
    console.log(`   Comissão Calculada: R$ ${resultado.valorComissao.toFixed(2)}`);
    console.log(`   Comissão Esperada: R$ ${valorEsperado.toFixed(2)}`);

    if (Math.abs(resultado.valorComissao - valorEsperado) < 0.01) {
      console.log(`   ✅ Cálculo correto!\n`);
      passed++;
    } else {
      console.log(`   ❌ Cálculo incorreto!\n`);
      failed++;
    }

    // 5. Testar com outra função
    console.log("📋 [5/6] Testando com GERENTE_CIRE...");
    const comercialGerente = await prisma.comercial.create({
      data: {
        usuarioId: (await prisma.usuario.create({
          data: {
            nome: "Gerente Cire",
            email: `gerente-${unique()}@e2e.test`,
            senhaHash: await hash("x", 4),
            tipo: "COMERCIAL",
          },
        })).id,
        nome: "Gerente Cire",
        cpf: gerarCPFValido(),
        gestorPfId: gestorPf.id,
        funcao: "GERENTE_CIRE",
      },
    });

    const resultadoGerente = await calcularComissaoComercial({
      comercialId: comercialGerente.id,
      valorProcedimento,
      dataReferencia: new Date(),
    });

    // Expected:
    // RegraComercial.unidade = 5%
    // RegraGestor.gerenteCire = 15%
    // Comissão = 1000 × 0.05 × 0.15 = R$ 7,50
    const valorGerenteEsperado = 7.50;

    console.log(`   Regra Gestor (gerenteCire): 15%`);
    console.log(`   Comissão Calculada: R$ ${resultadoGerente.valorComissao.toFixed(2)}`);
    console.log(`   Comissão Esperada: R$ ${valorGerenteEsperado.toFixed(2)}`);

    if (Math.abs(resultadoGerente.valorComissao - valorGerenteEsperado) < 0.01) {
      console.log(`   ✅ Cálculo correto!\n`);
      passed++;
    } else {
      console.log(`   ❌ Cálculo incorreto!\n`);
      failed++;
    }

    // 6. Testar sem regras (deve retornar 0)
    console.log("📋 [6/6] Testando sem regras...");
    const gestorSemRegras = await prisma.gestorPF.create({
      data: {
        usuarioId: (await prisma.usuario.create({
          data: {
            nome: "Gestor Sem Regras",
            email: `gestor-sem-${unique()}@e2e.test`,
            senhaHash: await hash("x", 4),
            tipo: "GERENCIA",
          },
        })).id,
        nome: "Gestor Sem Regras",
        cpf: gerarCPFValido(),
      },
    });

    const comercialSemRegras = await prisma.comercial.create({
      data: {
        usuarioId: (await prisma.usuario.create({
          data: {
            nome: "Comercial Sem Regras",
            email: `comercial-sem-${unique()}@e2e.test`,
            senhaHash: await hash("x", 4),
            tipo: "COMERCIAL",
          },
        })).id,
        nome: "Comercial Sem Regras",
        cpf: gerarCPFValido(),
        gestorPfId: gestorSemRegras.id,
        funcao: "SUPERVISOR_ATIVO",
      },
    });

    const resultadoSemRegras = await calcularComissaoComercial({
      comercialId: comercialSemRegras.id,
      valorProcedimento,
      dataReferencia: new Date(),
    });

    if (resultadoSemRegras.valorComissao === 0) {
      console.log(`   ✅ Retornou 0 sem regras!\n`);
      passed++;
    } else {
      console.log(`   ❌ Deveria retornar 0!\n`);
      failed++;
    }

    // Cleanup
    await prisma.comercial.deleteMany({ where: { gestorPfId: gestorSemRegras.id } });
    await prisma.gestorPF.delete({ where: { id: gestorSemRegras.id } });
    await prisma.comercial.deleteMany({ where: { id: { in: [comercialSemRegras.id, comercialGerente.id, comercialAtivo.id] } } });
    await prisma.regraGestor.delete({ where: { gestorPfId: gestorPf.id } });
    await prisma.regraComercial.delete({ where: { gestorPfId: gestorPf.id } });
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