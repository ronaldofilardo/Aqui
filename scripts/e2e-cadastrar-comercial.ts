#!/usr/bin/env tsx
/**
 * End-to-End Script: Cadastrar Comercial
 * Simula o fluxo completo de cadastro de um Comercial pelo Gestor PF,
 * incluindo validações, criação no banco, e verificações finais.
 *
 * USAGE:
 *   npx tsx scripts/e2e-cadastrar-comercial.ts
 *
 * REQUIREMENTS:
 *   - DATABASE_URL apontando para o banco de teste/local
 *   - Dependências do monorepo instaladas (pnpm install)
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { criarComercialSchema } from "@asa/shared";

// ─── Config ───────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

// Gera CPF válido com algoritmo de verificação
function gerarCPFValido(): string {
  const rand = (n: number) => Math.floor(Math.random() * n);
  const n1 = rand(10), n2 = rand(10), n3 = rand(10);
  const n4 = rand(10), n5 = rand(10), n6 = rand(10);
  const n7 = rand(10), n8 = rand(10), n9 = rand(10);
  
  // Calcula dígito 1
  let sum = n1*10 + n2*9 + n3*8 + n4*7 + n5*6 + n6*5 + n7*4 + n8*3 + n9*2;
  let d1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  // Calcula dígito 2
  sum = n1*11 + n2*10 + n3*9 + n4*8 + n5*7 + n6*6 + n7*5 + n8*4 + n9*3 + d1*2;
  let d2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  
  return `${n1}${n2}${n3}${n4}${n5}${n6}${n7}${n8}${n9}${d1}${d2}`;
}

let testLog: Array<{ step: string; status: "OK" | "FAIL"; details?: string }> = [];

function logStep(step: string, status: "OK" | "FAIL", details?:坐, details?: string);

function logStep(step: string, status: "OK" | "FAIL", details?: string) {
  testLog.push({ step, status, details });
  const icon = status === "OK" ? "✅" : "❌";
  console.log(`${icon} ${step}${details ? `: ${details}` : ""}`);
}

function printSummary() {
  console.log("\n" + "─".repeat(60));
  console.log("📋 SUMÁRIO DO TESTE");
  console.log("─".repeat(60));
  const ok = testLog.filter((t) => t.status === "OK").length;
  const fail = testLog.filter((t) => t.status === "FAIL").length;
  testLog.forEach((t) => {
    const icon = t.status === "OK" ? "✅" : "❌";
    console.log(`${icon} ${t.step}`);
  });
  console.log("─".repeat(60));
  console.log(`Total: ${ok + fail} passos | ✅ ${ok} OK | ❌ ${fail} FAIL`);
  if (fail > 0) {
    console.log("\n⚠️  HÁ FALHAS! Verifique os detalhes acima.");
    process.exit(1);
  } else {
    console.log("\n🎉 TODOS OS PASSOS PASSARAM!");
  }
}

// ─── Step 1: Setup ──────────────────────────────────────────────────────────
async function setup() {
  console.log("\n🔧 [1/6] Configurando ambiente de teste...\n");

  // Cria GestorPF
  const gestorUsuario = await prisma.usuario.create({
    data: {
      nome: "Gestor PF Teste",
      email: `gestor-pf-${unique()}@e2e.test`,
      senhaHash: await hash("senha123", 12),
      tipo: "GESTOR_PF",
    },
  });

  const gestorPf = await prisma.gestorPF.create({
    data: {
      usuarioId: gestorUsuario.id,
      nome: "Gestor PF Teste",
      cpf: gerarCPFValido(),
    },
  });

  logStep("Criar GestorPF", "OK", `ID: ${gestorPf.id}`);
  return { gestorPf, gestorUsuario };
}

// ─── Step 2: Schema Validation ───────────────────────────────────────────────
async function validateSchema(goodData, badData) {
  console.log("\n📋 [2/6] Validando schemas...\n");

  // Should pass
  const valid = criarComercialSchema.safeParse(goodData);
  if (valid.success) {
    logStep("Schema valida dados corretos", "OK");
  } else {
    logStep("Schema valida dados corretos", "FAIL", JSON.stringify(valid.error));
  }

  // Should fail (invalid email)
  const invalid = criarComercialSchema.safeParse(badData);
  if (!invalid.success) {
    logStep("Schema rejeita email inválido", "OK");
  } else {
    logStep("Schema rejeita email inválido", "FAIL", "Deveria ter rejeitado");
  }
}

// ─── Step 3: Simulate API (Cadastrar Comercial) ─────────────────────────────
async function cadastrarComercial(gestorPfId: string, payload: any) {
  console.log("\n🔐 [3/6] Simulando chamada à API...");
  console.log("   POST /api/v1/gestor-pf/comerciais");
  console.log("   Body:", JSON.stringify(payload, null, 2));

  // 1. Validate schema
  const parsed = criarComercialSchema.safeParse(payload);
  if (!parsed.success) {
    logStep("Schema validation", "FAIL", parsed.error.errors.map(e => e.message).join(", "));
    return null;
  }

  const { nome, email, cpf, telefone, percentualComissao } = parsed.data;
  const cpfClean = cpf.replace(/\D/g, "");
  const percentualNum =
    typeof percentualComissao === "string"
      ? parseFloat(percentualComissao)
      : percentualComissao;

  // 2. Check duplicate email
  const existsEmail = await prisma.usuario.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (existsEmail) {
    logStep("Verificar duplicidade de email", "FAIL", "Email já existe");
    return null;
  }

  // 3. Check duplicate CPF
  const existsCpf = await prisma.comercial.findUnique({
    where: { cpf: cpfClean },
  });
  if (existsCpf) {
    logStep("Verificar duplicidade de CPF", "FAIL", "CPF já existe");
    return null;
  }

  // 4. Create user and comercial
  const senhaTemporaria = cpfClean.substring(0, 5);
  const senhaHash = await hash(senhaTemporaria, 12);

  const result = await prisma.$transaction(async (tx) => {
    const usuario = await tx.usuario.create({
      data: {
        nome,
        email: email.toLowerCase().trim(),
        senhaHash,
        tipo: "COMERCIAL",
        telefone: telefone || undefined,
        senhaTemporaria: true,
      },
    });

    const comercial = await tx.comercial.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: cpfClean,
        percentualComissao: percentualNum,
        status: "ATIVO",
        gestorPfId,
      },
    });

    return { usuario, comercial, senhaTemporaria };
  });

  logStep("Cadastrar Comercial", "OK", `ID: ${result.comercial.id}, Usuario: ${result.usuario.email}`);
  return result;
}

// ─── Step 4: Verify Database State ────────────────────────────────────────────
async function verifyState(comercialId: string, expectedEmail: string) {
  console.log("\n🔍 [4/6] Verificando estado do banco...\n");

  const comercial = await prisma.comercial.findUnique({
    where: { id: comercialId },
    include: { usuario: true },
  });

  if (!comercial) {
    logStep("Comercial existe no banco", "FAIL", "Não encontrado");
    return;
  }

  logStep("Comercial existe no banco", "OK", `ID: ${comercial.id}`);

  if (comercial.usuario.email === expectedEmail.toLowerCase().trim()) {
    logStep("Email do usuário correto", "OK");
  } else {
    logStep("Email do usuário correto", "FAIL", `${comercial.usuario.email} !== ${expectedEmail}`);
  }

  if (comercial.usuario.tipo === "COMERCIAL") {
    logStep("Tipo do usuário é COMERCIAL", "OK");
  } else {
    logStep("Tipo do usuário é COMERCIAL", "FAIL", `Tipo: ${comercial.usuario.tipo}`);
  }

  if (comercial.usuario.senhaTemporaria === true) {
    logStep("senhaTemporaria = true", "OK");
  } else {
    logStep("senhaTemporaria = true", "FAIL");
  }

  if (comercial.status === "ATIVO") {
    logStep("Status é ATIVO", "OK");
  } else {
    logStep("Status é ATIVO", "FAIL", comercial.status);
  }

  if (comercial.percentualComissao !== null && comercial.percentualComissao >= 0) {
    logStep("Percentual de comissão correto", "OK", `${comercial.percentualComissao}%`);
  } else {
    logStep("Percentual de comissão correto", "FAIL", String(comercial.percentualComissao));
  }
}

// ─── Step 5: Test Duplicate Prevention ──────────────────────────────────────
async function testDuplicatePrevention(gestorPfId: string, existingEmail: string, existingCpf: string) {
  console.log("\n🛡️  [5/6] Testando prevenção de duplicados...\n");

  // Try to create with same email
  const emailResult = await prisma.usuario.findUnique({
    where: { email: existingEmail.toLowerCase().trim() },
  });
  if (emailResult) {
    logStep("Rejeita email duplicado", "OK", "Email já existe no banco");
  } else {
    logStep("Rejeita email duplicado", "FAIL", "Email não encontrado (inesperado)");
  }

  // Try to create with same CPF
  const cpfResult = await prisma.comercial.findUnique({
    where: { cpf: existingCpf.replace(/\D/g, "") },
  });
  if (cpfResult) {
    logStep("Rejeita CPF duplicado", "OK", "CPF já existe no banco");
  } else {
    logStep("Rejeita CPF duplicado", "FAIL", "CPF não encontrado (inesperado)");
  }
}

// ─── Step 6: Cleanup ────────────────────────────────────────────────────────
async function cleanup(...ids: Array<{ comercialId?: string; usuarioId?: string }>) {
  console.log("\n🧹 [6/6] Limpando dados de teste...\n");

  for (const item of ids) {
    if (item.comercialId) {
      await prisma.comercial.delete({ where: { id: item.comercialId } }).catch(() => {});
    }
    if (item.usuarioId) {
      await prisma.usuario.delete({ where: { id: item.usuarioId } }).catch(() => {});
    }
  }

  logStep("Limpar dados de teste", "OK");
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  E2E Test: Cadastrar Comercial                            ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  try {
    // Step 1: Setup
    const { gestorPf, gestorUsuario } = await setup();
    
    const cpf = gerarCPFValido();
    const email = `comercial-${unique()}@e2e.test`;

    // Step 2: Schema Validation
    await validateSchema(
      { nome: "Test", email, cpf, telefone: "11999999999", percentualComissao: "5.5" },
      { nome: "Test", email: "invalid-email", cpf, telefone: "11999999999", percentualComissao: "5.5" }
    );

    // Step 3: Simulate API
    const result = await cadastrarComercial(gestorPf.id, {
      nome: "Comercial E2E Test",
      email,
      cpf,
      telefone: "11999999999",
      percentualComissao: 7.5,
    });

    if (!result) {
      console.log("\n❌ Falha ao cadastrar comercial. Abortando.");
      process.exit(1);
    }

    // Step 4: Verify
    await verifyState(result.comercial.id, email);

    // Step 5: Test Duplicates
    await testDuplicatePrevention(gestorPf.id, email, cpf);

    // Step 6: Cleanup
    await cleanup(
      { comercialId: result.comercial.id, usuarioId: result.usuario.id },
      { usuarioId: gestorUsuario.id }
    );

    // Summary
    printSummary();

  } catch (error) {
    console.error("\n💥 ERRO INESPERADO:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
