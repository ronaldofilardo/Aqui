import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

describe("API - Lideranca Consultores PF", () => {
  let liderancaId: string;
  let consultorPfId: string;
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

  describe("GET /api/v1/lideranca/consultores-pf", () => {
    it("deve listar consultores_pf da lideranca", async () => {
      await criarConsultorPf(
        "Consultor PF Listagem",
        `consultorpf-list-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      const consultores = await prisma.consultorPf.findMany({
        where: { liderancaId },
        include: {
          usuario: {
            select: { id: true, email: true, status: true, telefone: true },
          },
        },
        orderBy: { criadoEm: "desc" },
      });

      expect(consultores.length).toBeGreaterThan(0);
      expect(consultores[0].usuario.email).toBeDefined();
      expect(consultores[0].usuario.telefone).toBeDefined();
    });

    it("deve retornar array vazio quando nao ha consultores_pf", async () => {
      const consultores = await prisma.consultorPf.findMany({
        where: { liderancaId },
        include: { usuario: true },
      });

      expect(Array.isArray(consultores)).toBe(true);
      expect(consultores.length).toBe(0);
    });
  });

  describe("POST /api/v1/lideranca/consultores-pf", () => {
    it("deve criar consultor_pf com sucesso", async () => {
      const email = `consultorpf-criar-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpf = `${Date.now()}00001`.slice(0, 11);

      const usuario = await prisma.usuario.create({
        data: {
          nome: "Consultor PF Criar",
          email,
          senhaHash: await hash("123456", 12),
          tipo: "CONSULTOR_PF",
          telefone: "11999999999",
          senhaTemporaria: true,
        },
      });
      createdUsuarioIds.push(usuario.id);

      const consultorPf = await prisma.consultorPf.create({
        data: {
          usuarioId: usuario.id,
          nome: "Consultor PF Criar",
          cpf,
          liderancaId,
          status: "ATIVO",
        },
      });

      expect(consultorPf.id).toBeDefined();
      expect(consultorPf.nome).toBe("Consultor PF Criar");
      expect(consultorPf.cpf).toBe(cpf);
      expect(consultorPf.liderancaId).toBe(liderancaId);
      expect(consultorPf.status).toBe("ATIVO");

      consultorPfId = consultorPf.id;
    });

    it("deve rejeitar CPF duplicado", async () => {
      const cpf = uniqueCpf();
      const email1 = `consultorpf-dup1-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const email2 = `consultorpf-dup2-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;

      const usuario1 = await prisma.usuario.create({
        data: {
          nome: "Consultor PF Dup1",
          email: email1,
          senhaHash: await hash("123456", 12),
          tipo: "CONSULTOR_PF",
        },
      });
      createdUsuarioIds.push(usuario1.id);

      await prisma.consultorPf.create({
        data: {
          usuarioId: usuario1.id,
          nome: "Consultor PF Dup1",
          cpf,
          liderancaId,
        },
      });

      const usuario2 = await prisma.usuario.create({
        data: {
          nome: "Consultor PF Dup2",
          email: email2,
          senhaHash: await hash("123456", 12),
          tipo: "CONSULTOR_PF",
        },
      });
      createdUsuarioIds.push(usuario2.id);

      const existente = await prisma.consultorPf.findUnique({
        where: { cpf },
      });

      expect(existente).toBeDefined();

      await expect(
        prisma.consultorPf.create({
          data: {
            usuarioId: usuario2.id,
            nome: "Consultor PF Dup2",
            cpf,
            liderancaId,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("PATCH /api/v1/lideranca/consultores-pf/[id]", () => {
    beforeEach(async () => {
      const { consultorPf } = await criarConsultorPf(
        "Consultor PF Update",
        `consultorpf-update-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );
      consultorPfId = consultorPf.id;
    });

    it("deve atualizar consultor_pf", async () => {
      const updated = await prisma.consultorPf.update({
        where: { id: consultorPfId },
        data: { nome: "Consultor PF Atualizado" },
        include: { usuario: true },
      });

      expect(updated.nome).toBe("Consultor PF Atualizado");
    });

    it("deve atualizar status para INATIVO", async () => {
      const updated = await prisma.consultorPf.update({
        where: { id: consultorPfId },
        data: { status: "INATIVO" },
      });

      expect(updated.status).toBe("INATIVO");
    });
  });

  describe("DELETE /api/v1/lideranca/consultores-pf/[id]", () => {
    beforeEach(async () => {
      const { consultorPf } = await criarConsultorPf(
        "Consultor PF Delete",
        `consultorpf-delete-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );
      consultorPfId = consultorPf.id;
    });

    it("deve remover consultor_pf (soft delete)", async () => {
      await prisma.$transaction(async (tx) => {
        await tx.usuario.update({
          where: { id: (await tx.consultorPf.findUnique({ where: { id: consultorPfId } }))!.usuarioId },
          data: { status: "INATIVO" },
        });

        await tx.consultorPf.update({
          where: { id: consultorPfId },
          data: { status: "INATIVO", atualizadoEm: new Date() },
        });
      });

      const consultorPf = await prisma.consultorPf.findUnique({
        where: { id: consultorPfId },
      });

      expect(consultorPf).toBeDefined();
      expect(consultorPf!.status).toBe("INATIVO");
    });
  });
});
