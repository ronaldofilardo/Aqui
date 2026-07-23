import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

describe("Consultor PF - Modelo e API", () => {
  let liderancaId: string;
  let backofficeId: string;
  let createdUsuarioIds: string[] = [];

  beforeEach(async () => {
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Teste",
        email: `backoffice-test-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
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

    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Teste",
        email: `lideranca-test-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
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

  async function criarUsuarioConsultorPf(nome: string, email: string) {
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
    return usuario;
  }

  describe("Model ConsultorPf", () => {
    it("deve criar consultor_pf vinculado a uma lideranca", async () => {
      const usuario = await criarUsuarioConsultorPf(
        "Consultor PF Teste",
        `consultorpf-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      const consultorPf = await prisma.consultorPf.create({
        data: {
          usuarioId: usuario.id,
          nome: "Consultor PF Teste",
          cpf: uniqueCpf(),
          liderancaId,
          status: "ATIVO",
        },
      });

      expect(consultorPf.id).toBeDefined();
      expect(consultorPf.usuarioId).toBe(usuario.id);
      expect(consultorPf.liderancaId).toBe(liderancaId);
      expect(consultorPf.status).toBe("ATIVO");
    });

    it("nao deve permitir CPF duplicado em consultor_pf", async () => {
      const cpf = uniqueCpf();

      const usuario1 = await criarUsuarioConsultorPf(
        "Consultor PF 1",
        `consultorpf1-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      await prisma.consultorPf.create({
        data: {
          usuarioId: usuario1.id,
          nome: "Consultor PF 1",
          cpf,
          liderancaId,
        },
      });

      const usuario2 = await criarUsuarioConsultorPf(
        "Consultor PF 2",
        `consultorpf2-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      await expect(
        prisma.consultorPf.create({
          data: {
            usuarioId: usuario2.id,
            nome: "Consultor PF 2",
            cpf,
            liderancaId,
          },
        }),
      ).rejects.toThrow();
    });

    it("deve listar consultores_pf por lideranca", async () => {
      const usuario = await criarUsuarioConsultorPf(
        "Consultor PF Listagem",
        `consultorpf-list-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      await prisma.consultorPf.create({
        data: {
          usuarioId: usuario.id,
          nome: "Consultor PF Listagem",
          cpf: uniqueCpf(),
          liderancaId,
        },
      });

      const consultores = await prisma.consultorPf.findMany({
        where: { liderancaId },
        include: { usuario: true },
      });

      expect(consultores.length).toBeGreaterThan(0);
      expect(consultores[0].liderancaId).toBe(liderancaId);
      expect(consultores[0].usuario.tipo).toBe("CONSULTOR_PF");
    });
  });

  describe("Model MetaLideranca", () => {
    it("deve criar meta para lideranca", async () => {
      const meta = await prisma.metaLideranca.create({
        data: {
          liderancaId,
          mesReferencia: "2026-07",
          valorMeta: 50000,
          valorAtingido: 0,
        },
      });

      expect(meta.id).toBeDefined();
      expect(meta.liderancaId).toBe(liderancaId);
      expect(Number(meta.valorMeta)).toBe(50000);
    });

    it("nao deve permitir duplicidade de mesReferencia para mesma lideranca", async () => {
      await prisma.metaLideranca.create({
        data: {
          liderancaId,
          mesReferencia: "2026-08",
          valorMeta: 10000,
        },
      });

      await expect(
        prisma.metaLideranca.create({
          data: {
            liderancaId,
            mesReferencia: "2026-08",
            valorMeta: 20000,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Model MetaConsultorPf", () => {
    it("deve criar meta para consultor_pf", async () => {
      const usuario = await criarUsuarioConsultorPf(
        "Consultor Meta",
        `consultor-meta-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      const consultorPf = await prisma.consultorPf.create({
        data: {
          usuarioId: usuario.id,
          nome: "Consultor Meta",
          cpf: uniqueCpf(),
          liderancaId,
        },
      });

      const meta = await prisma.metaConsultorPf.create({
        data: {
          consultorPfId: consultorPf.id,
          mesReferencia: "2026-07",
          valorMeta: 15000,
          valorAtingido: 5000,
        },
      });

      expect(meta.id).toBeDefined();
      expect(meta.consultorPfId).toBe(consultorPf.id);
      expect(Number(meta.valorMeta)).toBe(15000);
      expect(Number(meta.valorAtingido)).toBe(5000);
    });
  });

  describe("Lideranca - backoffice_id", () => {
    it("deve retornar lideranca com backofficeId correto", async () => {
      const lideranca = await prisma.lideranca.findUnique({
        where: { id: liderancaId },
      });

      expect(lideranca).toBeDefined();
      expect(lideranca!.backofficeId).toBe(backofficeId);
    });

    it("deve listar liderancas filtrando por backofficeId", async () => {
      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
      });

      expect(liderancas.length).toBeGreaterThan(0);
      expect(liderancas.every((l) => l.backofficeId === backofficeId)).toBe(true);
    });
  });
});
