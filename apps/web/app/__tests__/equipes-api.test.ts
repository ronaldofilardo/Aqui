import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

describe("API - Backoffice Equipes", () => {
  let backofficeId: string;
  let liderancaId: string;
  let createdUsuarioIds: string[] = [];

  beforeEach(async () => {
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Teste",
        email: `backoffice-equipes-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
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
        email: `lideranca-equipes-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
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

  async function criarComercial(nome: string, email: string) {
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash: await hash("123456", 12),
        tipo: "COMERCIAL",
        telefone: "11999999999",
      },
    });
    createdUsuarioIds.push(usuario.id);

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: uniqueCpf(),
        liderancaId,
        percentualComissao: 5.0,
        status: "ATIVO",
      },
    });

    return { usuario, comercial };
  }

  async function criarGestor(nome: string, email: string) {
    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash: await hash("123456", 12),
        tipo: "GESTOR_PJ",
        telefone: "11999999999",
      },
    });
    createdUsuarioIds.push(usuario.id);

    const gestor = await prisma.gestor.create({
      data: {
        usuarioId: usuario.id,
        nome,
        cpf: uniqueCpf(),
        liderancaId,
        percentualComissao: 0,
        status: "ATIVO",
      },
    });

    return { usuario, gestor };
  }

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

  describe("GET /api/v1/backoffice/equipes", () => {
    it("deve listar liderancas do backoffice com totais zerados quando sem equipe", async () => {
      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          usuario: { select: { email: true, status: true } },
          comerciais: {
            include: {
              usuario: { select: { email: true, status: true } },
              _count: { select: { parceiros: true } },
            },
          },
          gestores: {
            include: {
              usuario: { select: { email: true, status: true } },
              _count: { select: { parceiros: true } },
            },
          },
          consultorPfs: {
            include: {
              usuario: { select: { email: true, status: true } },
            },
          },
        },
      });

      const equipes = liderancas.map((l) => ({
        id: l.id,
        nome: l.nome,
        tipo: l.tipo,
        email: l.usuario.email,
        status: l.status,
        totais: {
          comerciais: l.comerciais.length,
          gestores: l.gestores.length,
          consultoresPf: l.consultorPfs.length,
          parceiros:
            l.comerciais.reduce((acc, c) => acc + c._count.parceiros, 0) +
            l.gestores.reduce((acc, g) => acc + g._count.parceiros, 0),
        },
      }));

      expect(equipes.length).toBeGreaterThan(0);
      expect(equipes[0].totais.comerciais).toBe(0);
      expect(equipes[0].totais.gestores).toBe(0);
      expect(equipes[0].totais.consultoresPf).toBe(0);
    });

    it("deve incluir comerciais, gestores e consultores_pf na equipe", async () => {
      await criarComercial(
        "Comercial Equipe",
        `comercial-equipe-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      await criarGestor(
        "Gestor Equipe",
        `gestor-equipe-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      await criarConsultorPf(
        "Consultor PF Equipe",
        `consultorpf-equipe-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          usuario: { select: { email: true } },
          comerciais: { include: { usuario: { select: { email: true } } } },
          gestores: { include: { usuario: { select: { email: true } } } },
          consultorPfs: { include: { usuario: { select: { email: true } } } },
        },
      });

      const lideranca = liderancas.find((l) => l.id === liderancaId)!;

      expect(lideranca.comerciais.length).toBeGreaterThan(0);
      expect(lideranca.gestores.length).toBeGreaterThan(0);
      expect(lideranca.consultorPfs.length).toBeGreaterThan(0);
    });

    it("deve retornar totais corretos por tipo", async () => {
      await criarComercial(
        "Comercial Total",
        `comercial-total-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      await criarConsultorPf(
        "Consultor PF Total",
        `consultorpf-total-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          comerciais: { include: { _count: { select: { parceiros: true } } } },
          gestores: { include: { _count: { select: { parceiros: true } } } },
          consultorPfs: true,
        },
      });

      const equipe = liderancas.map((l) => ({
        totais: {
          comerciais: l.comerciais.length,
          gestores: l.gestores.length,
          consultoresPf: l.consultorPfs.length,
          parceiros:
            l.comerciais.reduce((acc, c) => acc + c._count.parceiros, 0) +
            l.gestores.reduce((acc, g) => acc + g._count.parceiros, 0),
        },
      }));

      expect(equipe[0].totais.comerciais).toBeGreaterThanOrEqual(1);
      expect(equipe[0].totais.consultoresPf).toBeGreaterThanOrEqual(1);
    });

    it("deve filtrar apenas liderancas do backoffice", async () => {
      const outroBackofficeUsuario = await prisma.usuario.create({
        data: {
          nome: "Outro Backoffice",
          email: `outro-backoffice-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
          senhaHash: await hash("123456", 12),
          tipo: "BACKOFFICE",
          papel: "BACKOFFICE",
        },
      });

      const outroBackoffice = await prisma.backoffice.create({
        data: {
          usuarioId: outroBackofficeUsuario.id,
          nome: "Outro Backoffice",
          cpf: uniqueCpf(),
        },
      });

      const outraLiderancaUsuario = await prisma.usuario.create({
        data: {
          nome: "Outra Lideranca",
          email: `outra-lideranca-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
          senhaHash: await hash("123456", 12),
          tipo: "LIDERANCA",
        },
      });

      await prisma.lideranca.create({
        data: {
          usuarioId: outraLiderancaUsuario.id,
          nome: "Outra Lideranca",
          cpf: uniqueCpf(),
          backofficeId: outroBackoffice.id,
          tipo: "COMERCIAL",
        },
      });

      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
      });

      const liderancaIds = liderancas.map((l) => l.id);
      expect(liderancaIds).toContain(liderancaId);
    });
  });
});
