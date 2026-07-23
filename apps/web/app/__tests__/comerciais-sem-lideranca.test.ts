/**
 * Testes para funcionalidade de Comercial sem Liderança
 * Valida que comerciais podem ser criados e listados sem vínculo de liderança
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

async function criarBackoffice() {
  return prisma.backoffice.create({
    data: {
      usuario: {
        create: {
          nome: "Backoffice",
          email: `backoffice-${unique()}@asa.test`,
          senhaHash: await hash("x", 4),
          tipo: "BACKOFFICE",
          papel: "BACKOFFICE",
        },
      },
      nome: `Backoffice ${unique()}`,
      cpf: uniqueCpf(),
    },
  });
}

describe("Comercial sem Liderança", () => {
  let backofficeId: string;
  let comercialSemLiderancaId: string;
  let comercialComLiderancaId: string;
  let liderancaId: string;

  beforeAll(async () => {
    // Criar backoffice
    const backoffice = await criarBackoffice();
    backofficeId = backoffice.id;

    // Criar liderança para teste comparativo
    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: `Lideranca ${unique()}`,
        email: `lideranca-${unique()}@asa.test`,
        senhaHash: await hash("x", 4),
        tipo: "LIDERANCA",
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Test",
        cpf: uniqueCpf(),
        backofficeId,
        tipo: "COMERCIAL",
      },
    });
    liderancaId = lideranca.id;

    // Criar comercial SEM liderança
    const usuarioSemLideranca = await prisma.usuario.create({
      data: {
        nome: `Comercial Sem Lideranca ${unique()}`,
        email: `com-sem-lideranca-${unique()}@asa.test`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });

    const comercialSemLideranca = await prisma.comercial.create({
      data: {
        usuarioId: usuarioSemLideranca.id,
        nome: "Comercial Sem Lideranca",
        cpf: uniqueCpf(),
        liderancaId: null, // SEM liderança
        percentualComissao: 5.0,
        funcao: "SUPERVISOR_ATIVO",
        tipoLideranca: null,
      },
    });
    comercialSemLiderancaId = comercialSemLideranca.id;

    // Criar comercial COM liderança para comparação
    const usuarioComLideranca = await prisma.usuario.create({
      data: {
        nome: `Comercial Com Lideranca ${unique()}`,
        email: `com-com-lideranca-${unique()}@asa.test`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });

    const comercialComLideranca = await prisma.comercial.create({
      data: {
        usuarioId: usuarioComLideranca.id,
        nome: "Comercial Com Lideranca",
        cpf: uniqueCpf(),
        liderancaId, // COM liderança
        percentualComissao: 5.0,
        funcao: "GERENTE_CIRE",
        tipoLideranca: "COMERCIAL",
      },
    });
    comercialComLiderancaId = comercialComLideranca.id;
  });

  afterAll(async () => {
    // Cleanup
    const ids = [comercialSemLiderancaId, comercialComLiderancaId].filter(Boolean);
    if (ids.length > 0) {
      await prisma.comercial.deleteMany({
        where: { id: { in: ids } },
      });
    }
    await prisma.lideranca.deleteMany({ where: { id: liderancaId } });
    await prisma.backoffice.deleteMany({ where: { id: backofficeId } });
  });

  it("deve criar comercial sem liderança (liderancaId = null)", async () => {
    const comercial = await prisma.comercial.findUnique({
      where: { id: comercialSemLiderancaId },
      include: { usuario: true },
    });

    expect(comercial).toBeDefined();
    expect(comercial?.liderancaId).toBeNull();
    expect(comercial?.tipoLideranca).toBeNull();
    expect(comercial?.nome).toBe("Comercial Sem Lideranca");
    expect(comercial?.usuario.tipo).toBe("COMERCIAL");
  });

  it("deve criar comercial com liderança (liderancaId != null)", async () => {
    const comercial = await prisma.comercial.findUnique({
      where: { id: comercialComLiderancaId },
      include: { usuario: true, lideranca: true },
    });

    expect(comercial).toBeDefined();
    expect(comercial?.liderancaId).toBe(liderancaId);
    expect(comercial?.tipoLideranca).toBe("COMERCIAL");
    expect(comercial?.nome).toBe("Comercial Com Lideranca");
    expect(comercial?.lideranca).toBeDefined();
  });

  it("deve listar comerciais sem liderança quando buscar por liderancaId = null", async () => {
    const comerciaisSemLideranca = await prisma.comercial.findMany({
      where: {
        liderancaId: null,
        usuario: { tipo: "COMERCIAL" },
      },
      include: {
        usuario: { select: { email: true, status: true } },
      },
    });

    expect(comerciaisSemLideranca.length).toBeGreaterThan(0);
    expect(
      comerciaisSemLideranca.every((c) => c.liderancaId === null)
    ).toBe(true);
  });

  it("deve listar comerciais com liderança quando buscar por liderancaId != null", async () => {
    const comerciaisComLideranca = await prisma.comercial.findMany({
      where: {
        liderancaId: { not: null },
        usuario: { tipo: "COMERCIAL" },
      },
      include: {
        usuario: { select: { email: true, status: true } },
        lideranca: true,
      },
    });

    expect(comerciaisComLideranca.length).toBeGreaterThan(0);
    expect(
      comerciaisComLideranca.every((c) => c.liderancaId !== null)
    ).toBe(true);
    expect(
      comerciaisComLideranca.every((c) => c.lideranca !== null)
    ).toBe(true);
  });

  it("deve permitir atualizar comercial sem liderança para ter liderança", async () => {
    // Criar um comercial temporário sem liderança
    const usuarioTemp = await prisma.usuario.create({
      data: {
        nome: `Temp ${unique()}`,
        email: `temp-${unique()}@asa.test`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });

    const comercialTemp = await prisma.comercial.create({
      data: {
        usuarioId: usuarioTemp.id,
        nome: "Temp",
        cpf: uniqueCpf(),
        liderancaId: null,
        percentualComissao: 0,
      },
    });

    // Atualizar para ter liderança
    const atualizado = await prisma.comercial.update({
      where: { id: comercialTemp.id },
      data: {
        liderancaId,
        tipoLideranca: "COMERCIAL",
      },
    });

    expect(atualizado.liderancaId).toBe(liderancaId);
    expect(atualizado.tipoLideranca).toBe("COMERCIAL");

    // Cleanup
    await prisma.comercial.delete({ where: { id: comercialTemp.id } });
    await prisma.usuario.delete({ where: { id: usuarioTemp.id } });
  });

  it("deve permitir atualizar comercial com liderança para não ter liderança", async () => {
    // Criar um comercial temporário com liderança
    const usuarioTemp = await prisma.usuario.create({
      data: {
        nome: `Temp2 ${unique()}`,
        email: `temp2-${unique()}@asa.test`,
        senhaHash: await hash("x", 4),
        tipo: "COMERCIAL",
      },
    });

    const comercialTemp = await prisma.comercial.create({
      data: {
        usuarioId: usuarioTemp.id,
        nome: "Temp2",
        cpf: uniqueCpf(),
        liderancaId,
        percentualComissao: 0,
        tipoLideranca: "COMERCIAL",
      },
    });

    // Atualizar para não ter liderança
    const atualizado = await prisma.comercial.update({
      where: { id: comercialTemp.id },
      data: {
        liderancaId: null,
        tipoLideranca: null,
      },
    });

    expect(atualizado.liderancaId).toBeNull();
    expect(atualizado.tipoLideranca).toBeNull();

    // Cleanup
    await prisma.comercial.delete({ where: { id: comercialTemp.id } });
    await prisma.usuario.delete({ where: { id: usuarioTemp.id } });
  });

  it("deve buscar todos os comerciais (com e sem liderança) em uma única query", async () => {
    // Simular a query que a API GET usa
    const liderancas = await prisma.lideranca.findMany({
      where: { backofficeId },
      include: {
        comerciais: {
          include: {
            usuario: { select: { id: true, email: true, status: true } },
          },
        },
      },
    });

    const comerciaisComLideranca = liderancas.flatMap((l) => l.comerciais);

    const comerciaisSemLideranca = await prisma.comercial.findMany({
      where: {
        liderancaId: null,
      },
      include: {
        usuario: { select: { id: true, email: true, status: true } },
      },
    });

    const todosComerciais = [
      ...comerciaisComLideranca,
      ...comerciaisSemLideranca,
    ];

    expect(todosComerciais.length).toBeGreaterThanOrEqual(2);
    
    const temComLideranca = todosComerciais.some(
      (c) => c.liderancaId !== null
    );
    const temSemLideranca = todosComerciais.some(
      (c) => c.liderancaId === null
    );

    expect(temComLideranca).toBe(true);
    expect(temSemLideranca).toBe(true);
  });
});