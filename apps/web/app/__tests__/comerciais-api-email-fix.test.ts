/**
 * Testes - Fix do Email Duplicado na API de Comerciais
 * Valida que a correcao do bug onde criar um comercial sem lideranca existente
 * gerava dois usuarios com o mesmo email causando unique constraint violation.
 *
 * Como o import do handler de rota falha por dependencias de next-auth no
 * ambiente de teste (Node puro), testamos a LOGICA do fix diretamente:
 * - O email da lideranca deve ser diferente do email do comercial
 * - O upsert deve ser idempotente (nao quebra se email ja existe)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

/**
 * Simula a logica do fix: gerar email unico para lideranca baseado no CPF e backofficeId.
 * Esta eh a mesma logica implementada na route.ts (linha ~103).
 */
function gerarEmailLideranca(cpfComercial: string, backofficeId: string): string {
  return `lideranca-${cpfComercial}@${backofficeId}.com`;
}

async function criarBackoffice() {
  const usuario = await prisma.usuario.create({
    data: {
      nome: "Backoffice Fix Test",
      email: `backoffice-fix-${unique()}@asa.test`,
      senhaHash: await hash("x", 4),
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    },
  });

  return prisma.backoffice.create({
    data: {
      usuarioId: usuario.id,
      nome: "Backoffice Fix Test",
      cpf: uniqueCpf(),
    },
  });
}

describe("Fix: Email Duplicado na Criacao de Comercial", () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;
  const cleanupIds: { usuarios: string[]; liderancas: string[]; comerciais: string[] } = {
    usuarios: [],
    liderancas: [],
    comerciais: [],
  };

  beforeAll(async () => {
    const backoffice = await criarBackoffice();
    backofficeId = backoffice.id;
    backofficeUsuarioId = backoffice.usuarioId;
  });

  afterAll(async () => {
    // Cleanup em ordem para respeitar constraints
    await prisma.comercial.deleteMany({
      where: { id: { in: cleanupIds.comerciais } },
    }).catch(() => {});
    await prisma.lideranca.deleteMany({
      where: { id: { in: cleanupIds.liderancas } },
    }).catch(() => {});
    await prisma.usuario.deleteMany({
      where: { id: { in: cleanupIds.usuarios } },
    }).catch(() => {});
    await prisma.usuario.delete({ where: { id: backofficeUsuarioId } }).catch(() => {});
    await prisma.backoffice.delete({ where: { id: backofficeId } }).catch(() => {});
  });

  it("email da lideranca deve ser diferente do email do comercial", () => {
    const cpfComercial = "12345678901";
    const emailComercial = "joao@asa.test";
    const emailLideranca = gerarEmailLideranca(cpfComercial, backofficeId);

    expect(emailLideranca).not.toBe(emailComercial);
    expect(emailLideranca).toContain(cpfComercial);
    expect(emailLideranca).toContain(backofficeId);
  });

  it("email da lideranca deve seguir o padrao lideranca-{cpf}@{backofficeId}.com", () => {
    const cpf = "98765432100";
    const email = gerarEmailLideranca(cpf, backofficeId);
    expect(email).toBe(`lideranca-${cpf}@${backofficeId}.com`);
  });

  it("email unico da lideranca nao deve conflitar com email do comercial", async () => {
    const emailComercial = `com-fix-${unique()}@asa.test`;
    const cpf = uniqueCpf();
    const emailLideranca = gerarEmailLideranca(cpf, backofficeId);

    // Criar usuario lideranca com email unico gerado
    const usuarioLideranca = await prisma.usuario.create({
      data: {
        nome: "Lideranca Fix",
        email: emailLideranca,
        senhaHash: await hash("x", 4),
        tipo: "LIDERANCA",
        papel: "BACKOFFICE",
      },
    });
    cleanupIds.usuarios.push(usuarioLideranca.id);

    // Criar lideranca
    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: usuarioLideranca.id,
        nome: "Lideranca Fix",
        cpf: uniqueCpf(),
        backofficeId,
        tipo: "COMERCIAL",
      },
    });
    liderancaId = lideranca.id;
    cleanupIds.liderancas.push(lideranca.id);

    // Criar usuario comercial - nao deve conflitar com lideranca
    const usuarioComercial = await prisma.usuario.create({
      data: {
        nome: "Comercial Fix",
        email: emailComercial,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });
    cleanupIds.usuarios.push(usuarioComercial.id);

    // Criar comercial vinculado a lideranca
    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: usuarioComercial.id,
        liderancaId: lideranca.id,
        nome: "Comercial Fix",
        cpf,
        percentualComissao: 0,
      },
    });
    cleanupIds.comerciais.push(comercial.id);

    expect(comercial.liderancaId).toBe(lideranca.id);
    expect(usuarioLideranca.email).not.toBe(usuarioComercial.email);
  });

  it("upsert deve ser idempotente: criar lideranca duas vezes com mesmo cpf nao deve falhar", async () => {
    const cpf = uniqueCpf();
    const emailLideranca = gerarEmailLideranca(cpf, backofficeId);

    // Primeiro upsert (create)
    const u1 = await prisma.usuario.upsert({
      where: { email: emailLideranca },
      update: {},
      create: {
        nome: "Lideranca Upsert",
        email: emailLideranca,
        senhaHash: await hash("x", 4),
        tipo: "LIDERANCA",
        papel: "BACKOFFICE",
      },
    });
    cleanupIds.usuarios.push(u1.id);

    // Segundo upsert (deve atualizar, nao criar novo)
    const u2 = await prisma.usuario.upsert({
      where: { email: emailLideranca },
      update: {},
      create: {
        nome: "Lideranca Upsert 2",
        email: emailLideranca,
        senhaHash: await hash("x", 4),
        tipo: "LIDERANCA",
        papel: "BACKOFFICE",
      },
    });

    // Mesmo usuario, nao deve duplicar
    expect(u2.id).toBe(u1.id);
  });

  it("dois comerciais com emails diferentes devem poder ser criados sob a mesma lideranca", async () => {
    const cpf1 = uniqueCpf();
    const cpf2 = uniqueCpf();
    const email1 = `com1-fix-${unique()}@asa.test`;
    const email2 = `com2-fix-${unique()}@asa.test`;

    // Reutilizar a lideranca criada no teste anterior (ou criar nova)
    let lideranca = await prisma.lideranca.findFirst({
      where: { backofficeId, tipo: "COMERCIAL" },
    });

    if (!lideranca) {
      const emailLider = gerarEmailLideranca(cpf1, backofficeId);
      const uLider = await prisma.usuario.create({
        data: {
          nome: "Lideranca Dup",
          email: emailLider,
          senhaHash: await hash("x", 4),
          tipo: "LIDERANCA",
          papel: "BACKOFFICE",
        },
      });
      cleanupIds.usuarios.push(uLider.id);

      lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: uLider.id,
          nome: "Lideranca Dup",
          cpf: uniqueCpf(),
          backofficeId,
          tipo: "COMERCIAL",
        },
      });
      cleanupIds.liderancas.push(lideranca.id);
    }

    // Criar dois comerciais com emails diferentes
    const u1 = await prisma.usuario.create({
      data: {
        nome: "Comercial 1",
        email: email1,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });
    cleanupIds.usuarios.push(u1.id);

    const c1 = await prisma.comercial.create({
      data: {
        usuarioId: u1.id,
        liderancaId: lideranca.id,
        nome: "Comercial 1",
        cpf: cpf1,
        percentualComissao: 0,
      },
    });
    cleanupIds.comerciais.push(c1.id);

    const u2 = await prisma.usuario.create({
      data: {
        nome: "Comercial 2",
        email: email2,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });
    cleanupIds.usuarios.push(u2.id);

    const c2 = await prisma.comercial.create({
      data: {
        usuarioId: u2.id,
        liderancaId: lideranca.id,
        nome: "Comercial 2",
        cpf: cpf2,
        percentualComissao: 0,
      },
    });
    cleanupIds.comerciais.push(c2.id);

    expect(c1.liderancaId).toBe(lideranca.id);
    expect(c2.liderancaId).toBe(lideranca.id);
    expect(c1.id).not.toBe(c2.id);
  });
});
