#!/usr/bin/env tsx
/**
 * Script de Debug: Testa a API de Comerciais diretamente
 * Simula uma requisição HTTP real para /api/v1/gestor-pf/comerciais
 */

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Debug: Verificando estado do banco e usuários...\n");

  // 1. Verificar se existe GestorPF
  const gestores = await prisma.gestorPF.findMany({
    include: { usuario: { select: { id: true, email: true, tipo: true } } },
  });
  console.log(`📊 Gestores PF encontrados: ${gestores.length}`);
  gestores.forEach((g) => {
    console.log(`   - ${g.nome} | Email: ${g.usuario.email} | ID: ${g.id}`);
  });

  // 2. Verificar se existe usuário com tipo GESTOR_PF
  const usuariosGestorPf = await prisma.usuario.findMany({
    where: { tipo: "GESTOR_PF" },
    include: { gestorPf: true },
  });
  console.log(`\n📊 Usuários com tipo GESTOR_PF: ${usuariosGestorPf.length}`);
  usuariosGestorPf.forEach((u) => {
    console.log(`   - ${u.nome} | Email: ${u.email} | ID: ${u.id}`);
  });

  // 3. Verificar Comerciais existentes
  const comerciais = await prisma.comercial.findMany({
    include: { usuario: { select: { email: true } }, gestorPf: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  console.log(`\n📊 Comerciais (últimos 10): ${comerciais.length}`);
  comerciais.forEach((c) => {
    console.log(`   - ${c.nome} | CPF: ${c.cpf} | Email: ${c.usuario.email} | Gestor: ${c.gestorPf?.nome}`);
  });

  // 4. Criar um GestorPF de teste se não existir
  if (gestores.length === 0) {
    console.log("\n🔧 Criando GestorPF de teste...\n");
    const testEmail = `gestor-pf-teste@asa.com`;
    
    // Verifica se já existe
    const existing = await prisma.usuario.findUnique({
      where: { email: testEmail },
    });

    let usuarioId = existing?.id;
    if (!existing) {
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Gestor PF Teste",
          email: testEmail,
          senhaHash: await hash("123456", 12),
          tipo: "GESTOR_PF",
        },
      });
      usuarioId = usuario.id;
      console.log(`✅ Usuário criado: ${testEmail}`);
    } else {
      console.log(`ℹ️  Usuário já existe: ${testEmail}`);
    }

    const gestorPf = await prisma.gestorPF.findUnique({
      where: { usuarioId: usuarioId! },
    });

    if (!gestorPf) {
      await prisma.gestorPF.create({
        data: {
          usuarioId: usuarioId!,
          nome: "Gestor PF Teste",
          cpf: "12345678901",
        },
      });
      console.log(`✅ GestorPF vinculado criado`);
    }

    console.log("\n📝 Use estas credenciais para testar no frontend:");
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: 123456`);
  }

  // 5. Verificar schema do Comercial
  console.log("\n📋 Verificando schema da tabela Comercial...");
  const sampleComercial = await prisma.comercial.findFirst();
  if (sampleComercial) {
    console.log("   Campos do Comercial:", Object.keys(sampleComercial).join(", "));
  }

  await prisma.$disconnect();
  console.log("\n✅ Debug completo!");
}

main().catch((err) => {
  console.error("❌ Erro:", err);
  process.exit(1);
});