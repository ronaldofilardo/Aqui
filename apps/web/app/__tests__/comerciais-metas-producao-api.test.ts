import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpsert = vi.fn();
const mockFindFirst = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@asa/database", () => ({
  prisma: {
    metaComercial: {
      upsert: mockUpsert,
      findMany: mockFindMany,
    },
    comercial: {
      findFirst: mockFindFirst,
    },
  },
}));

describe("API - Metas Comerciais com Produção", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/v1/backoffice/comerciais/[id]/metas", () => {
    it("deve salvar apenas valorMeta quando valorAtingido não for fornecido", async () => {
      mockFindFirst.mockResolvedValue({
        id: "comercial-1",
        lideranca: null,
      });

      mockUpsert.mockResolvedValue({
        id: "meta-1",
        comercialId: "comercial-1",
        mesReferencia: "2026-01",
        valorMeta: 1000,
        valorAtingido: 0,
      });

      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorMeta: 1000,
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          comercialId_mesReferencia: {
            comercialId: "comercial-1",
            mesReferencia: "2026-01",
          },
        },
        create: expect.objectContaining({
          valorMeta: 1000,
          valorAtingido: 0,
        }),
        update: expect.objectContaining({
          valorMeta: 1000,
        }),
      });
    });

    it("deve salvar apenas valorAtingido quando valorMeta não for fornecido", async () => {
      mockFindFirst.mockResolvedValue({
        id: "comercial-1",
        lideranca: null,
      });

      mockUpsert.mockResolvedValue({
        id: "meta-1",
        comercialId: "comercial-1",
        mesReferencia: "2026-01",
        valorMeta: 1000,
        valorAtingido: 850,
      });

      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorAtingido: 850,
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          comercialId_mesReferencia: {
            comercialId: "comercial-1",
            mesReferencia: "2026-01",
          },
        },
        create: expect.objectContaining({
          valorMeta: 0,
          valorAtingido: 850,
        }),
        update: expect.objectContaining({
          valorAtingido: 850,
        }),
      });
    });

    it("deve salvar valorMeta e valorAtingido juntos", async () => {
      mockFindFirst.mockResolvedValue({
        id: "comercial-1",
        lideranca: null,
      });

      mockUpsert.mockResolvedValue({
        id: "meta-1",
        comercialId: "comercial-1",
        mesReferencia: "2026-01",
        valorMeta: 1000,
        valorAtingido: 850,
      });

      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorMeta: 1000,
          valorAtingido: 850,
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(200);
      expect(mockUpsert).toHaveBeenCalledWith({
        where: {
          comercialId_mesReferencia: {
            comercialId: "comercial-1",
            mesReferencia: "2026-01",
          },
        },
        create: expect.objectContaining({
          valorMeta: 1000,
          valorAtingido: 850,
        }),
        update: expect.objectContaining({
          valorMeta: 1000,
          valorAtingido: 850,
        }),
      });
    });

    it("deve atualizar apenas valorAtingido sem sobrescrever valorMeta", async () => {
      mockFindFirst.mockResolvedValue({
        id: "comercial-1",
        lideranca: null,
      });

      mockUpsert.mockResolvedValue({
        id: "meta-1",
        comercialId: "comercial-1",
        mesReferencia: "2026-01",
        valorMeta: 1000,
        valorAtingido: 900,
      });

      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorAtingido: 900,
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(200);

      const callArgs = mockUpsert.mock.calls[0][0];
      expect(callArgs.update).not.toHaveProperty("valorMeta");
      expect(callArgs.update).toHaveProperty("valorAtingido", 900);
    });

    it("deve aceitar valorMeta como string e converter para número", async () => {
      mockFindFirst.mockResolvedValue({
        id: "comercial-1",
        lideranca: null,
      });

      mockUpsert.mockResolvedValue({
        id: "meta-1",
        comercialId: "comercial-1",
        mesReferencia: "2026-01",
        valorMeta: 1500.50,
        valorAtingido: 0,
      });

      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorMeta: "1500.50",
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(200);

      const callArgs = mockUpsert.mock.calls[0][0];
      expect(callArgs.create.valorMeta).toBe(1500.50);
    });

    it("deve aceitar valorAtingido como string e converter para número", async () => {
      mockFindFirst.mockResolvedValue({
        id: "comercial-1",
        lideranca: null,
      });

      mockUpsert.mockResolvedValue({
        id: "meta-1",
        comercialId: "comercial-1",
        mesReferencia: "2026-01",
        valorMeta: 0,
        valorAtingido: 1234.56,
      });

      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorAtingido: "1234.56",
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(200);

      const callArgs = mockUpsert.mock.calls[0][0];
      expect(callArgs.create.valorAtingido).toBe(1234.56);
    });

    it("deve retornar erro quando nenhum valor é fornecido", async () => {
      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(400);
    });

    it("deve retornar erro quando valorMeta for negativo", async () => {
      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorMeta: -100,
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(400);
    });

    it("deve retornar erro quando valorAtingido for negativo", async () => {
      const { POST } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mesReferencia: "2026-01",
          valorAtingido: -50,
        }),
      });

      const response = await POST(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/v1/backoffice/comerciais/[id]/metas", () => {
    it("deve retornar metas com valorMeta e valorAtingido", async () => {
      mockFindFirst.mockResolvedValue({
        id: "comercial-1",
        lideranca: null,
      });

      mockFindMany.mockResolvedValue([
        {
          id: "meta-1",
          comercialId: "comercial-1",
          mesReferencia: "2026-01",
          valorMeta: 1000,
          valorAtingido: 850,
        },
        {
          id: "meta-2",
          comercialId: "comercial-1",
          mesReferencia: "2026-02",
          valorMeta: 1200,
          valorAtingido: 0,
        },
      ]);

      const { GET } = await import("../api/v1/backoffice/comerciais/[id]/metas/route");
      const req = new Request("http://localhost:3000/api/v1/backoffice/comerciais/comercial-1/metas");

      const response = await GET(req, { params: { id: "comercial-1" } });
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data).toHaveLength(2);
      expect(data[0]).toHaveProperty("valorMeta");
      expect(data[0]).toHaveProperty("valorAtingido");
      expect(data[0].valorMeta).toBe(1000);
      expect(data[0].valorAtingido).toBe(850);
    });
  });
});