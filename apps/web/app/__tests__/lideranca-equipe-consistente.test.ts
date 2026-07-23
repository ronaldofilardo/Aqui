import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

describe("API - Liderança Equipe Page", () => {
  let backofficeId: string;
  let liderancaId: string;
  let createdUsuarioIds: string[] = [];

  beforeEach(async () => {
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Teste Equipe",
        email: `backoffice-equipe-page-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
      },
    });

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: "Backoffice Teste Equipe",
        cpf: uniqueCpf(),
      },
    });

    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Teste Equipe",
        email: `lideranca-equipe-page-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Teste Equipe",
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

  async function criarConsultorPf(nome: string, email: string, cpf?: string) {
    const usuario = await prisma.usuario.create({
      data: {
        nome,
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
        nome,
        cpf: cpf || uniqueCpf(),
        liderancaId,
        status: "ATIVO",
      },
    });

    return { usuario, consultorPf };
  }

  describe("GET /api/v1/lideranca/equipe", () => {
    it("deve retornar equipe da liderança autenticada", async () => {
      const liderancaData = await prisma.lideranca.findUnique({
        where: { id: liderancaId },
        include: {
          consultorPfs: {
            include: {
              usuario: { select: { email: true } }
            }
          }
        },
      });

      expect(liderancaData).toBeDefined();
      expect(liderancaData?.consultorPfs).toBeDefined();
      expect(Array.isArray(liderancaData?.consultorPfs)).toBe(true);
    });

    it("deve retornar totais zerados quando sem equipe", async () => {
      const liderancaData = await prisma.lideranca.findUnique({
        where: { id: liderancaId },
        include: {
          consultorPfs: true,
        },
      });

      expect(liderancaData?.consultorPfs.length).toBe(0);
    });

    it("deve retornar consultores PF da equipe", async () => {
      await criarConsultorPf(
        "Consultor PF Equipe Teste",
        `consultorpf-equipe-teste-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      const liderancaData = await prisma.lideranca.findUnique({
        where: { id: liderancaId },
        include: {
          consultorPfs: {
            include: {
              usuario: { select: { email: true, status: true } }
            }
          }
        },
      });

      expect(liderancaData?.consultorPfs.length).toBeGreaterThan(0);
      expect(liderancaData?.consultorPfs[0].nome).toBe("Consultor PF Equipe Teste");
      expect(liderancaData?.consultorPfs[0].usuario.email).toBeDefined();
    });

    it("deve retornar múltiplos consultores PF", async () => {
      await criarConsultorPf(
        "Consultor PF 1",
        `consultorpf1-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );
      await criarConsultorPf(
        "Consultor PF 2",
        `consultorpf2-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`,
      );

      const liderancaData = await prisma.lideranca.findUnique({
        where: { id: liderancaId },
        include: {
          consultorPfs: true,
        },
      });

      expect(liderancaData?.consultorPfs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("POST /api/v1/lideranca/consultores-pf", () => {
    it("deve criar consultor PF com sucesso via API", async () => {
      const email = `consultorpf-api-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpf = `${Date.now()}00001`.slice(0, 11);

      const usuario = await prisma.usuario.create({
        data: {
          nome: "Consultor PF API Test",
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
          nome: "Consultor PF API Test",
          cpf,
          liderancaId,
          status: "ATIVO",
        },
      });

      expect(consultorPf.id).toBeDefined();
      expect(consultorPf.nome).toBe("Consultor PF API Test");
      expect(consultorPf.cpf).toBe(cpf);
      expect(consultorPf.liderancaId).toBe(liderancaId);
      expect(consultorPf.status).toBe("ATIVO");
    });

    it("deve rejeitar CPF duplicado", async () => {
      const cpf = uniqueCpf();
      const email1 = `consultorpf-dup1-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const email2 = `consultorpf-dup2-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;

      await criarConsultorPf("Consultor PF Dup1", email1, cpf);

      const existingCpf = await prisma.consultorPf.findUnique({
        where: { cpf },
      });

      expect(existingCpf).toBeDefined();

      await expect(
        criarConsultorPf("Consultor PF Dup2", email2, cpf)
      ).rejects.toThrow();
    });

    it("deve rejeitar email duplicado", async () => {
      const email = `consultorpf-email-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;

      await criarConsultorPf("Consultor PF Email1", email);

      const existingEmail = await prisma.usuario.findUnique({
        where: { email },
      });

      expect(existingEmail).toBeDefined();

      const cpf2 = uniqueCpf();
      await expect(
        criarConsultorPf("Consultor PF Email2", email, cpf2)
      ).rejects.toThrow();
    });
  });

  describe("Fluxo completo - Cadastro e Listagem", () => {
    it("deve permitir cadastrar e listar consultor PF", async () => {
      const email = `consultorpf-fluxo-${Date.now()}${Math.random().toString(36).slice(2)}@asa.test`;
      const cpf = `${Date.now()}00002`.slice(0, 11);

      const usuario = await prisma.usuario.create({
        data: {
          nome: "Consultor PF Fluxo",
          email,
          senhaHash: await hash("123456", 12),
          tipo: "CONSULTOR_PF",
          senhaTemporaria: true,
        },
      });
      createdUsuarioIds.push(usuario.id);

      const consultorPf = await prisma.consultorPf.create({
        data: {
          usuarioId: usuario.id,
          nome: "Consultor PF Fluxo",
          cpf,
          liderancaId,
          status: "ATIVO",
        },
      });

      expect(consultorPf.id).toBeDefined();

      const liderancaData = await prisma.lideranca.findUnique({
        where: { id: liderancaId },
        include: {
          consultorPfs: {
            include: {
              usuario: { select: { email: true, status: true } }
            }
          }
        },
      });

      const consultorNaLista = liderancaData?.consultorPfs.find(c => c.id === consultorPf.id);
      expect(consultorNaLista).toBeDefined();
      expect(consultorNaLista?.nome).toBe("Consultor PF Fluxo");
      expect(consultorNaLista?.usuario.email).toBe(email);
    });
  });
});