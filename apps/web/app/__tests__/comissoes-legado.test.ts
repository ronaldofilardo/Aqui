import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";

/**
 * Tests para os campos de retorno "aviso" das rotas legadas de comissões
 * de parceiro. Confirma que (1) a resposta inclui `aviso` indicando dados
 * legados, e (2) que o GET continua funcionando com leitura normal.
 *
 * Estes tests NÃO invocam o Prisma — eles verificam a forma da resposta do
 * GET mockando a sessão. A integração real é exercitada com testes de
 * modelo/testes do upload.
 */

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@asa/database", () => {
  const parceiroresFake = [
    {
      id: "p1",
      nome: "Parceiro Antigo",
      cpf: "53051173991",
      status: "ATIVO",
      percentualComissao: "5.00",
      usuario: { status: "ATIVO", email: "p@x.com", id: "u1" },
      _count: { indicacoes: 0 },
      comissoes: [],
    },
  ];

  return {
    prisma: {
      parceiro: {
        findMany: () => Promise.resolve(parceiroresFake),
      },
      procedimentoPF: {
        findMany: () => Promise.resolve([]),
      },
      comissaoParceiro: {
        findMany: () => Promise.resolve([]),
      },
    },
  };
});

vi.mock("@/lib/api-helpers", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/api-helpers")>(
      "@/lib/api-helpers",
    );
  return {
    ...actual,
    requireGestorPFWithScope: vi.fn(async () => ({
      session: { user: { id: "gestor-id", tipo: "GESTOR_PF" } },
      gestorPfId: "gestor-pf-id",
      error: null,
    })),
    requireParceiroWithScope: vi.fn(async () => ({
      session: { user: { id: "parceiro-user-id", tipo: "PARCEIRO" } },
      parceiroId: "p1",
      error: null,
    })),
  };
});

import { GET as getGestorPFComissoes } from "@/app/api/v1/gestor-pf/comissoes/route";
import { GET as getParceiroComissoes } from "@/app/api/v1/parceiro/comissoes/route";

import { vi } from "vitest";

describe("GET /api/v1/gestor-pf/comissoes (legado)", () => {
  it("deve retornar advertencia de dados legados", async () => {
    const req = new NextRequest("http://localhost/api/v1/gestor-pf/comissoes");
    const res = await getGestorPFComissoes(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.aviso).toBeTruthy();
    expect(typeof json.aviso).toBe("string");
    expect(json.aviso.toLowerCase()).toContain("legado");
    expect(Array.isArray(json.dados)).toBe(true);
  });
});

describe("GET /api/v1/parceiro/comissoes (legado)", () => {
  it("deve retornar advertencia de dados legados", async () => {
    const req = new NextRequest("http://localhost/api/v1/parceiro/comissoes");
    const res = await getParceiroComissoes(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.aviso).toBeTruthy();
    expect(json.aviso.toLowerCase()).toContain("legado");
  });

  it("deve incluir resumo zerado quando não há procedimentos", async () => {
    const req = new NextRequest("http://localhost/api/v1/parceiro/comissoes");
    const res = await getParceiroComissoes(req);
    const json = await res.json();

    expect(json.resumo).toBeDefined();
    expect(json.resumo.totalComissao).toBe(0);
    expect(json.procedimentos).toEqual([]);
    expect(json.historico).toEqual([]);
  });
});
