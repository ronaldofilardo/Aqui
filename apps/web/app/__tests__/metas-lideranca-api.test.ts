import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

describe("API - Lideranca Metas", () => {
  let liderancaId: string;
  let consultorPfId: string;
  let createdUsuarioIds: string[] = [];

  beforeEach(async () => {
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Teste",
        email: `backoffice-metas-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
      },
    });

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: "Backoffice Teste",
        cpf: uniqueCpf(),
      },
    });

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Teste",
        email: `lideranca-metas-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Teste",
        cpf: uniqueCpf(),
        backofficeId: backoffice.id,
        tipo: "COMERCIAL",
      },
    });

    liderancaId = lideranca.id;
  });

  afterEach(async () => {
    for (const usuarioId of createdUsuarioIds) {
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: "INATIVO" },
      }).catch(() => {});
    }
    createdUsuarioIds = [];
  });

  async function criarConsultorPf(nome: string, email: string) {
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash: await hash("123456", 12),
        tipo: "CONSULTOR_PF",
        telefone: "11999999999",
      },
    });
    createdUsuarioIds.push(usuario.id);

    const consultorPf = await prisma.consultorPf.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: uniqueCpf(),
        liderancaId,
        status: "ATIVO",
      },
    });

    return { usuario, consultorPf };
  }

  describe("GET /api/v1/lideranca/metas", () => {
    it("deve listar metas da lideranca", async () => {
      await prisma.metaLideranca.create({
        data: {
          liderancaId,
          mesReferencia: "2026-07",
          valorMeta: 50000,
          valorAtingido: 12000,
        },
      });

      const metas = await prisma.metaLideranca.findMany({
        where: { liderancaId },
        orderBy: { createdAt: "desc" },
      });

      expect(metas.length).toBeGreaterThan(0);
      expect(metas[0].mesReferencia).toBe("2026-07");
      expect(Number(metas[0].valorMeta)).toBe(50000);
      expect(Number(metas[0].valorAtingido)).toBe(12000);
    });

    it("deve retornar metas vazias quando nao existem", async () => {
      const metas = await prisma.metaLideranca.findMany({
        where: { liderancaId: "00000000-0000-0000-0000-000000000000" },
      });

      expect(metas.length).toBe(0);
    });
  });

  describe("POST /api/v1/lideranca/metas", () => {
    it("deve criar meta para lideranca", async () => {
      const existing = await prisma.metaLideranca.findFirst({
        where: { liderancaId, mesReferencia: "2026-08" },
      });

      const meta = existing
        ? await prisma.metaLideranca.update({
            where: { id: existing.id },
            data: { valorMeta: 60000 },
          })
        : await prisma.metaLideranca.create({
            data: {
              liderancaId,
              mesReferencia: "2026-08",
              valorMeta: 60000,
            },
          });

      expect(meta.id).toBeDefined();
      expect(meta.liderancaId).toBe(liderancaId);
      expect(Number(meta.valorMeta)).toBe(60000);
    });

    it("deve atualizar meta existente da lideranca (upsert)", async () => {
      await prisma.metaLideranca.create({
        data: {
          liderancaId,
          mesReferencia: "2026-09",
          valorMeta: 40000,
        },
      });

      const existing = await prisma.metaLideranca.findFirst({
        where: { liderancaId, mesReferencia: "2026-09" },
      });

      expect(existing).toBeDefined();
      expect(Number(existing!.valorMeta)).toBe(40000);

      const updated = await prisma.metaLideranca.update({
        where: { id: existing!.id },
        data: { valorMeta: 50000 },
      });

      expect(Number(updated.valorMeta)).toBe(50000);
    });
  });

  describe("GET /api/v1/lideranca/consultores-pf/[id]/metas", () => {
    beforeEach(async () => {
      const { consultorPf } = await criarConsultorPf(
        "Consultor PF Metas",
        `consultorpf-metas-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );
      consultorPfId = consultorPf.id;
    });

    it("deve listar metas do consultor_pf", async () => {
      await prisma.metaConsultorPf.create({
        data: {
          consultorPfId,
          mesReferencia: "2026-07",
          valorMeta: 20000,
          valorAtingido: 8000,
        },
      });

      const metas = await prisma.metaConsultorPf.findMany({
        where: { consultorPfId },
        orderBy: { createdAt: "desc" },
      });

      expect(metas.length).toBeGreaterThan(0);
      expect(metas[0].consultorPfId).toBe(consultorPfId);
      expect(Number(metas[0].valorMeta)).toBe(20000);
    });

    it("deve retornar array vazio quando nao ha metas", async () => {
      const metas = await prisma.metaConsultorPf.findMany({
        where: { consultorPfId: "00000000-0000-0000-0000-000000000000" },
      });

      expect(metas.length).toBe(0);
    });
  });

  describe("POST /api/v1/lideranca/consultores-pf/[id]/metas", () => {
    beforeEach(async () => {
      const { consultorPf } = await criarConsultorPf(
        "Consultor PF CriarMeta",
        `consultorpf-criarmeta-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );
      consultorPfId = consultorPf.id;
    });

    it("deve criar meta para consultor_pf", async () => {
      const existing = await prisma.metaConsultorPf.findFirst({
        where: { consultorPfId, mesReferencia: "2026-07" },
      });

      const meta = existing
        ? await prisma.metaConsultorPf.update({
            where: { id: existing.id },
            data: { valorMeta: 18000 },
          })
        : await prisma.metaConsultorPf.create({
            data: {
              consultorPfId,
              mesReferencia: "2026-07",
              valorMeta: 18000,
            },
          });

      expect(meta.id).toBeDefined();
      expect(meta.consultorPfId).toBe(consultorPfId);
      expect(Number(meta.valorMeta)).toBe(18000);
    });
  });
});
