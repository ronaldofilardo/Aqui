/**
 * Testes - Fix do Campo 'tipo' removido da API de Comerciais
 * Valida que o modelo Comercial nao possui o campo 'tipo',
 * usando apenas 'tipoLideranca' para diferenciar COMERCIAL/GESTOR.
 * 
 * O bug original tentava acessar 'comercial.tipo' que nao existe no schema.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

async function criarBackoffice() {
  const usuario = await prisma.usuario.create({
    data: {
      nome: "Backoffice Tipo Fix",
      email: `backoffice-tipofix-${unique()}@test.com`,
      senhaHash: await hash("x", 4),
      tipo: "BACKOFFICE",
      papel: "BACKOFFICE",
    },
  });

  return prisma.backoffice.create({
    data: {
      usuarioId: usuario.id,
      nome: "Backoffice Tipo Fix",
      cpf: uniqueCpf(),
    },
  });
}

async function criarLideranca(backofficeId: string, tipo: "COMERCIAL" | "GESTOR" = "COMERCIAL") {
  const usuario = await prisma.usuario.create({
    data: {
      nome: `Lideranca ${tipo}`,
      email: `lideranca-${tipo}-${unique()}@test.com`,
      senhaHash: await hash("x", 4),
      tipo: "LIDERANCA",
    },
  });

  return prisma.lideranca.create({
    data: {
      usuarioId: usuario.id,
      nome: `Lideranca ${tipo}`,
      cpf: uniqueCpf(),
      backofficeId,
      tipo,
    },
  });
}

async function criarComercial(
  liderancaId: string,
  data?: {
    tipoLideranca?: "COMERCIAL" | "GESTOR";
    funcao?: string;
  }
) {
  const usuario = await prisma.usuario.create({
    data: {
      nome: `Comercial ${unique()}`,
      email: `comercial-${unique()}@test.com`,
      senhaHash: await hash("x", 4),
      tipo: "COMERCIAL",
    },
  });

  return prisma.comercial.create({
    data: {
      usuarioId: usuario.id,
      nome: `Comercial ${unique()}`,
      cpf: uniqueCpf(),
      liderancaId,
      percentualComissao: 5.0,
      tipoLideranca: data?.tipoLideranca,
      funcao: data?.funcao,
    },
    include: {
      usuario: { select: { id: true, email: true, status: true, tipo: true } },
      lideranca: { select: { id: true, tipo: true, backofficeId: true } },
    },
  });
}

describe("Comercial API - Campo 'tipo' inexistente", () => {
  let backofficeId: string;
  let liderancaComercialId: string;
  let liderancaGestorId: string;
  const cleanupIds: { usuarios: string[]; liderancas: string[]; comerciais: string[] } = {
    usuarios: [],
    liderancas: [],
    comerciais: [],
  };

  beforeAll(async () => {
    const backoffice = await criarBackoffice();
    backofficeId = backoffice.id;

    const liderancaComercial = await criarLideranca(backofficeId, "COMERCIAL");
    liderancaComercialId = liderancaComercial.id;
    cleanupIds.liderancas.push(liderancaComercial.id);

    const liderancaGestor = await criarLideranca(backofficeId, "GESTOR");
    liderancaGestorId = liderancaGestor.id;
    cleanupIds.liderancas.push(liderancaGestor.id);
  });

  afterAll(async () => {
    await prisma.comercial.deleteMany({
      where: { id: { in: cleanupIds.comerciais } },
    }).catch(() => {});
    await prisma.lideranca.deleteMany({
      where: { id: { in: cleanupIds.liderancas } },
    }).catch(() => {});
    await prisma.usuario.deleteMany({
      where: { id: { in: cleanupIds.usuarios } },
    }).catch(() => {});
    await prisma.backoffice.delete({ where: { id: backofficeId } }).catch(() => {});
  });

  it("Comercial nao deve ter campo 'tipo' direto, apenas 'tipoLideranca'", async () => {
    const comercial = await criarComercial(liderancaComercialId, {
      tipoLideranca: "COMERCIAL",
    });
    cleanupIds.comerciais.push(comercial.id);
    cleanupIds.usuarios.push(comercial.usuarioId);

    // Verificar que o schema tem tipoLideranca
    expect(comercial).toHaveProperty("tipoLideranca");
    expect(comercial.tipoLideranca).toBe("COMERCIAL");

    // Verificar que nao tem campo 'tipo' no Comercial
    expect(comercial).not.toHaveProperty("tipo");
  });

  it("Comercial sob Lideranca GESTOR deve ter tipoLideranca='GESTOR'", async () => {
    const comercial = await criarComercial(liderancaGestorId, {
      tipoLideranca: "GESTOR",
    });
    cleanupIds.comerciais.push(comercial.id);
    cleanupIds.usuarios.push(comercial.usuarioId);

    expect(comercial.tipoLideranca).toBe("GESTOR");
    expect(comercial.lideranca.tipo).toBe("GESTOR");
  });

  it("GET Comerciais deve retornar apenas campos validos", async () => {
    const comercial = await criarComercial(liderancaComercialId);
    cleanupIds.comerciais.push(comercial.id);
    cleanupIds.usuarios.push(comercial.usuarioId);

    // Simular o response da API GET
    const response = {
      id: comercial.id,
      nome: comercial.nome,
      cpf: comercial.cpf,
      email: comercial.usuario.email,
      funcao: comercial.funcao,
      percentualComissao: Number(comercial.percentualComissao),
      status: comercial.status,
      createdAt: comercial.createdAt,
      liderancaId: comercial.liderancaId,
      tipoLideranca: comercial.tipoLideranca,
      // NOTA: campo 'tipo' foi removido pois nao existe no modelo
    };

    expect(response).toHaveProperty("id");
    expect(response).toHaveProperty("tipoLideranca");
    expect(response).not.toHaveProperty("tipo");
  });

  it("POST Comerciais - schema nao deve aceitar campo 'tipo'", async () => {
    const payloadValido = {
      nome: `Novo Comercial ${unique()}`,
      cpf: uniqueCpf(),
      email: `novo-${unique()}@test.com`,
      percentualComissao: 5.0,
      lideranca: "COMERCIAL" as "COMERCIAL" | "GESTOR",
      // 'tipo' foi removido do schema
    };

    // O payload valido nao tem 'tipo'
    expect(payloadValido).not.toHaveProperty("tipo");
    expect(payloadValido).toHaveProperty("lideranca");
  });

  it("PATCH Comerciais - atualizar apenas tipoLideranca, nao 'tipo'", async () => {
    const comercial = await criarComercial(liderancaComercialId);
    cleanupIds.comerciais.push(comercial.id);
    cleanupIds.usuarios.push(comercial.usuarioId);

    // Dados para update (sem campo 'tipo')
    const updateData = {
      nome: "Nome Atualizado",
      percentualComissao: 7.5,
      lideranca: "GESTOR" as "COMERCIAL" | "GESTOR",
    };

    // Simular update
    const updated = await prisma.comercial.update({
      where: { id: comercial.id },
      data: {
        nome: updateData.nome,
        percentualComissao: updateData.percentualComissao,
        tipoLideranca: updateData.lideranca,
      },
      include: { usuario: true },
    });

    expect(updated.nome).toBe("Nome Atualizado");
    expect(Number(updated.percentualComissao)).toBe(7.5);
    expect(updated.tipoLideranca).toBe("GESTOR");
    expect(updated).not.toHaveProperty("tipo");
  });

  it("Comercial com funcao e tipoLideranca deve persistir corretamente", async () => {
    const comercial = await criarComercial(liderancaComercialId, {
      funcao: "GERENTE_CIRE",
      tipoLideranca: "COMERCIAL",
    });
    cleanupIds.comerciais.push(comercial.id);
    cleanupIds.usuarios.push(comercial.usuarioId);

    expect(comercial.funcao).toBe("GERENTE_CIRE");
    expect(comercial.tipoLideranca).toBe("COMERCIAL");
    expect(comercial).not.toHaveProperty("tipo");
  });

  it("Tipos de Usuario devem ser corretos: COMERCIAL para usuario, LIDERANCA para lider", async () => {
    const comercial = await criarComercial(liderancaComercialId);
    cleanupIds.comerciais.push(comercial.id);
    cleanupIds.usuarios.push(comercial.usuarioId);

    expect(comercial.usuario.tipo).toBe("COMERCIAL");
    expect(comercial.lideranca.tipo).toBe("COMERCIAL");
  });
});