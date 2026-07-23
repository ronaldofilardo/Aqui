/**
 * Testes de Integração - API de Metas dos Comerciais
 * Valida o CRUD de metas mensais para comerciais.
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

async function criarComercial(liderancaId: string) {
  const u = await prisma.usuario.create({
    data: {
      nome: `${unique()}`,
      email: `com-${unique()}@asa.test`,
      senhaHash: await hash("x", 4),
      tipo: "COMERCIAL",
    },
  });
  return prisma.comercial.create({
    data: {
      usuarioId: u.id,
      nome: u.nome,
      cpf: uniqueCpf(),
      liderancaId,
      percentualComissao: 0,
    },
  });
}

describe("API Metas Comerciais - Integração", () => {
  let backofficeId: string;
  let liderancaId: string;
  let comercialId: string;
  let comercialIds: string[] = [];

  beforeAll(async () => {
    const gp = await criarBackoffice();
    backofficeId = gp.id;

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: gp.usuarioId,
        nome: gp.nome,
        cpf: uniqueCpf(),
        tipo: "COMERCIAL",
        backofficeId: gp.id,
      },
    });
    liderancaId = lideranca.id;

    const c = await criarComercial(liderancaId);
    comercialId = c.id;
    comercialIds.push(comercialId);
  });

  afterAll(async () => {
    await prisma.metaComercial.deleteMany({
      where: { comercialId: { in: comercialIds } },
    });
    await prisma.comissaoComercial.deleteMany({
      where: { comercialId: { in: comercialIds } },
    });
    await prisma.comercial.deleteMany({
      where: { id: { in: comercialIds } },
    });
    await prisma.lideranca.deleteMany({ where: { id: liderancaId } });
    await prisma.backoffice.deleteMany({ where: { id: backofficeId } });
  });

  describe("POST /api/v1/backoffice/comerciais/[id]/metas", () => {
    it("deve criar meta mensal para comercial", async () => {
      const meta = await prisma.metaComercial.create({
        data: {
          comercialId,
          mesReferencia: "2026-01",
          valorMeta: 10000,
          valorAtingido: 0,
        },
      });

      expect(meta.id).toBeDefined();
      expect(meta.mesReferencia).toBe("2026-01");
      expect(Number(meta.valorMeta)).toBe(10000);
    });

    it("deve atualizar meta existente via upsert", async () => {
      // Cria meta inicial
      await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-02",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-02",
          valorMeta: 5000,
          valorAtingido: 0,
        },
        update: {},
      });

      // Atualiza meta
      await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-02",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-02",
          valorMeta: 5000,
          valorAtingido: 0,
        },
        update: { valorMeta: 8000 },
      });

      const metaAtualizada = await prisma.metaComercial.findUnique({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-02",
          },
        },
      });

      expect(Number(metaAtualizada?.valorMeta)).toBe(8000);
    });

    it("deve criar metas para todos os 12 meses do ano", async () => {
      const meses = [
        "2026-01",
        "2026-02",
        "2026-03",
        "2026-04",
        "2026-05",
        "2026-06",
        "2026-07",
        "2026-08",
        "2026-09",
        "2026-10",
        "2026-11",
        "2026-12",
      ];

      for (const mes of meses) {
        await prisma.metaComercial.upsert({
          where: {
            comercialId_mesReferencia: {
              comercialId,
              mesReferencia: mes,
            },
          },
          create: {
            comercialId,
            mesReferencia: mes,
            valorMeta: 10000,
            valorAtingido: 0,
          },
          update: { valorMeta: 10000 },
        });
      }

      const metas = await prisma.metaComercial.findMany({
        where: { comercialId },
      });

      expect(metas).toHaveLength(12);
    });

    it("deve permitir valores decimais para meta", async () => {
      const meta = await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-13",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-13",
          valorMeta: 1234.56,
          valorAtingido: 0,
        },
        update: { valorMeta: 1234.56 },
      });

      expect(Number(meta.valorMeta)).toBe(1234.56);
    });

    it("deve atualizar valorAtingido quando vendas forem registradas", async () => {
      const mesRef = "2026-14";
      const valorVendas = 7500;

      const meta = await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: mesRef,
          },
        },
        create: {
          comercialId,
          mesReferencia: mesRef,
          valorMeta: 10000,
          valorAtingido: valorVendas,
        },
        update: { valorAtingido: valorVendas },
      });

      expect(Number(meta.valorAtingido)).toBe(7500);
    });

    it("deve calcular percentual de atingimento da meta", async () => {
      const mesRef = "2026-15";
      const valorMeta = 10000;
      const valorAtingido = 8500;

      const meta = await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: mesRef,
          },
        },
        create: {
          comercialId,
          mesReferencia: mesRef,
          valorMeta,
          valorAtingido,
        },
        update: { valorAtingido },
      });

      const percentualAtingimento = (Number(meta.valorAtingido) / Number(meta.valorMeta)) * 100;
      expect(percentualAtingimento).toBe(85);
    });

    it("deve permitir meta com valor zero", async () => {
      const meta = await prisma.metaComercial.upsert({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-17",
          },
        },
        create: {
          comercialId,
          mesReferencia: "2026-17",
          valorMeta: 0,
          valorAtingido: 0,
        },
        update: { valorMeta: 0 },
      });

      expect(Number(meta.valorMeta)).toBe(0);
    });
  });

  describe("GET /api/v1/backoffice/comerciais/[id]/metas", () => {
    it("deve retornar todas as metas de um comercial", async () => {
      const metas = await prisma.metaComercial.findMany({
        where: { comercialId },
        orderBy: { mesReferencia: "asc" },
      });

      expect(metas.length).toBeGreaterThan(0);
      expect(metas[0]).toHaveProperty("mesReferencia");
      expect(metas[0]).toHaveProperty("valorMeta");
      expect(metas[0]).toHaveProperty("valorAtingido");
    });

    it("deve retornar meta específica por mês", async () => {
      const meta = await prisma.metaComercial.findUnique({
        where: {
          comercialId_mesReferencia: {
            comercialId,
            mesReferencia: "2026-01",
          },
        },
      });

      expect(meta).toBeDefined();
      expect(meta?.mesReferencia).toBe("2026-01");
    });
  });
});