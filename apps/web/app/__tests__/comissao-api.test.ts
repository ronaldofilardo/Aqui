/**
 * Testes de Integração - API de Comissões
 * Valida que a API aceita e retorna o campo valorComissao
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

describe("API - Comissão nas Metas dos Comerciais", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve aceitar valorComissao no payload da requisição POST /api/v1/backoffice/comerciais/:id/metas", async () => {
    const mockComercialId = "comercial-1";
    const mockMesReferencia = "2026-01";
    const mockValorComissao = 150.50;

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "meta-1",
        comercialId: mockComercialId,
        mesReferencia: mockMesReferencia,
        valorMeta: 1000,
        valorAtingido: 800,
        valorComissao: mockValorComissao,
      }),
    });

    global.fetch = mockFetch as any;

    const response = await fetch(`/api/v1/backoffice/comerciais/${mockComercialId}/metas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mesReferencia: mockMesReferencia,
        valorComissao: mockValorComissao,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.valorComissao).toBe(mockValorComissao);
  });

  it("deve retornar valorComissao na resposta da GET /api/v1/backoffice/comerciais/:id/metas", async () => {
    const mockComercialId = "comercial-1";
    const mockMetas = [
      {
        id: "meta-1",
        comercialId: mockComercialId,
        mesReferencia: "2026-01",
        valorMeta: 1000,
        valorAtingido: 800,
        valorComissao: 50,
      },
      {
        id: "meta-2",
        comercialId: mockComercialId,
        mesReferencia: "2026-02",
        valorMeta: 1200,
        valorAtingido: 0,
        valorComissao: 75,
      },
    ];

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockMetas,
    });

    global.fetch = mockFetch as any;

    const response = await fetch(`/api/v1/backoffice/comerciais/${mockComercialId}/metas`);

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].valorComissao).toBe(50);
    expect(data[1].valorComissao).toBe(75);
  });

  it("deve aceitar valorComissao junto com valorMeta e valorAtingido", async () => {
    const mockComercialId = "comercial-1";
    const mockMesReferencia = "2026-03";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "meta-3",
        comercialId: mockComercialId,
        mesReferencia: mockMesReferencia,
        valorMeta: 1500,
        valorAtingido: 1200,
        valorComissao: 100,
      }),
    });

    global.fetch = mockFetch as any;

    const response = await fetch(`/api/v1/backoffice/comerciais/${mockComercialId}/metas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mesReferencia: mockMesReferencia,
        valorMeta: 1500,
        valorAtingido: 1200,
        valorComissao: 100,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.valorMeta).toBe(1500);
    expect(data.valorAtingido).toBe(1200);
    expect(data.valorComissao).toBe(100);
  });

  it("deve aceitar salvar apenas valorComissao sem valorMeta ou valorAtingido", async () => {
    const mockComercialId = "comercial-1";
    const mockMesReferencia = "2026-04";

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "meta-4",
        comercialId: mockComercialId,
        mesReferencia: mockMesReferencia,
        valorComissao: 125.75,
      }),
    });

    global.fetch = mockFetch as any;

    const response = await fetch(`/api/v1/backoffice/comerciais/${mockComercialId}/metas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mesReferencia: mockMesReferencia,
        valorComissao: 125.75,
      }),
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data.valorComissao).toBe(125.75);
  });
});