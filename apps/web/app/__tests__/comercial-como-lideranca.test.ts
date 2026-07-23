import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

describe("API - Comercial como Liderança", () => {
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

  describe("POST /api/v1/backoffice/comerciais - com liderança", () => {
    it("deve criar comercial marcado como liderança COMERCIAL", async () => {
      const email = `comercial-lideranca-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpf = uniqueCpf();

      const usuario = await prisma.usuario.create({
        data: {
          nome: "Comercial Liderança Teste",
          email,
          senhaHash: await hash("123456", 12),
          tipo: "LIDERANCA",
          telefone: "11999999999",
        },
      });
      createdUsuarioIds.push(usuario.id);

      const lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: usuario.id,
          nome: "Comercial Liderança Teste",
          cpf,
          backofficeId,
          tipo: "COMERCIAL",
          status: "ATIVO",
        },
      });

      expect(lideranca.id).toBeDefined();
      expect(lideranca.nome).toBe("Comercial Liderança Teste");
      expect(lideranca.cpf).toBe(cpf);
      expect(lideranca.backofficeId).toBe(backofficeId);
      expect(lideranca.tipo).toBe("COMERCIAL");
      expect(lideranca.status).toBe("ATIVO");

      const usuarioLideranca = await prisma.usuario.findUnique({
        where: { id: usuario.id },
      });

      expect(usuarioLideranca).toBeDefined();
      expect(usuarioLideranca?.tipo).toBe("LIDERANCA");
    });

    it("deve criar comercial marcado como liderança GESTOR", async () => {
      const email = `gestor-lideranca-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpf = uniqueCpf();

      const usuario = await prisma.usuario.create({
        data: {
          nome: "Gestor Liderança Teste",
          email,
          senhaHash: await hash("123456", 12),
          tipo: "LIDERANCA",
          telefone: "11999999999",
        },
      });
      createdUsuarioIds.push(usuario.id);

      const lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: usuario.id,
          nome: "Gestor Liderança Teste",
          cpf,
          backofficeId,
          tipo: "GESTOR",
          status: "ATIVO",
        },
      });

      expect(lideranca.id).toBeDefined();
      expect(lideranca.tipo).toBe("GESTOR");

      const usuarioLideranca = await prisma.usuario.findUnique({
        where: { id: usuario.id },
      });

      expect(usuarioLideranca?.tipo).toBe("LIDERANCA");
    });

    it("deve listar lideranças criadas como comercial", async () => {
      const email = `comercial-list-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpf = uniqueCpf();

      const usuario = await prisma.usuario.create({
        data: {
          nome: "Comercial Listagem",
          email,
          senhaHash: await hash("123456", 12),
          tipo: "LIDERANCA",
        },
      });
      createdUsuarioIds.push(usuario.id);

      const lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: usuario.id,
          nome: "Comercial Listagem",
          cpf,
          backofficeId,
          tipo: "COMERCIAL",
        },
      });

      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          usuario: { select: { email: true, tipo: true } },
        },
      });

      expect(liderancas.length).toBeGreaterThan(0);
      const criada = liderancas.find(l => l.id === lideranca.id);
      expect(criada).toBeDefined();
      expect(criada?.usuario.tipo).toBe("LIDERANCA");
    });

    it("deve permitir que liderança tenha comerciais na equipe", async () => {
      const emailLideranca = `lideranca-equipe-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpfLideranca = uniqueCpf();

      const usuarioLideranca = await prisma.usuario.create({
        data: {
          nome: "Liderança Equipe",
          email: emailLideranca,
          senhaHash: await hash("123456", 12),
          tipo: "LIDERANCA",
        },
      });
      createdUsuarioIds.push(usuarioLideranca.id);

      const lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: usuarioLideranca.id,
          nome: "Liderança Equipe",
          cpf: cpfLideranca,
          backofficeId,
          tipo: "COMERCIAL",
        },
      });

      const emailComercial = `comercial-equipe-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpfComercial = uniqueCpf();

      const usuarioComercial = await prisma.usuario.create({
        data: {
          nome: "Comercial Equipe",
          email: emailComercial,
          senhaHash: await hash("123456", 12),
          tipo: "COMERCIAL",
        },
      });
      createdUsuarioIds.push(usuarioComercial.id);

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: usuarioComercial.id,
          nome: "Comercial Equipe",
          cpf: cpfComercial,
          liderancaId: lideranca.id,
          percentualComissao: 5.0,
          status: "ATIVO",
        },
      });

      const liderancaComEquipe = await prisma.lideranca.findUnique({
        where: { id: lideranca.id },
        include: {
          comerciais: {
            include: {
              usuario: { select: { email: true, tipo: true } },
            },
          },
        },
      });

      expect(liderancaComEquipe?.comerciais.length).toBe(1);
      expect(liderancaComEquipe?.comerciais[0].nome).toBe("Comercial Equipe");
      expect(liderancaComEquipe?.comerciais[0].usuario.tipo).toBe("COMERCIAL");
    });
  });
});