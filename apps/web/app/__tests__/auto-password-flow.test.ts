import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { generateResetToken, hashToken } from "@/lib/password-reset";

describe("Auto-Password Flow - Consultores & Estabelecimento Users", () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testCpf = "12345678901";

  let usuarioId: string;
  let gestorId: string;
  let consultorId: string;
  let usuarioEstabelecimentoId: string;
  let estabelecimentoId: string;

  beforeAll(async () => {
    // Limpar dados de teste anteriores (respeitar FK constraints)
    await prisma.passwordResetToken.deleteMany({});
    await prisma.usuarioEstabelecimento.deleteMany({});
    await prisma.gestorConsultor.deleteMany({});
    await prisma.estabelecimento.deleteMany({});
    await prisma.consultor.deleteMany({});
    await prisma.usuario.deleteMany({});

    // Criar usuário gestor
    const gestor = await prisma.usuario.create({
      data: {
        nome: "Gestor Teste",
        email: `gestor-${Date.now()}@test.com`,
        senhaHash: await hash("password123", 10),
        tipo: "GESTOR",
      },
    });
    gestorId = gestor.id;
  });

  afterAll(async () => {
    // Limpar dados de teste (respeitar FK constraints)
    await prisma.passwordResetToken.deleteMany({});
    await prisma.usuarioEstabelecimento.deleteMany({});
    await prisma.gestorConsultor.deleteMany({});
    await prisma.estabelecimento.deleteMany({});
    await prisma.consultor.deleteMany({});
    await prisma.usuario.deleteMany({});
  });

  describe("Usuario com senhaTemporaria", () => {
    it("deve criar usuário com senhaTemporaria=true por padrão", async () => {
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Consultor Auto Password",
          email: testEmail,
          senhaHash: await hash("auto123", 12),
          tipo: "CONSULTOR",
          senhaTemporaria: true,
        },
      });

      expect(usuario.senhaTemporaria).toBe(true);
      usuarioId = usuario.id;
    });

    it("deve permitir atualizar senhaTemporaria para false", async () => {
      const updated = await prisma.usuario.update({
        where: { id: usuarioId },
        data: { senhaTemporaria: false },
      });

      expect(updated.senhaTemporaria).toBe(false);
    });
  });

  describe("Consultor auto-gerado com CPF", () => {
    it("deve criar consultor com CPF durante registro", async () => {
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Novo Consultor",
          email: `consultor-${Date.now()}@test.com`,
          senhaHash: await hash("12345", 12), // Primeira 5 dígitos CPF: 12345
          tipo: "CONSULTOR",
          senhaTemporaria: true,
        },
      });

      const consultor = await prisma.consultor.create({
        data: {
          usuarioId: usuario.id,
          cpf: testCpf,
        },
      });

      expect(consultor.cpf).toBe(testCpf);
      expect(consultor.usuarioId).toBe(usuario.id);
      consultorId = consultor.id;
    });

    it("deve criar GestorConsultor para relacionar gestor com consultor", async () => {
      const relation = await prisma.gestorConsultor.create({
        data: {
          gestorId,
          consultorId,
        },
      });

      expect(relation.gestorId).toBe(gestorId);
      expect(relation.consultorId).toBe(consultorId);
    });
  });

  describe("PasswordResetToken para primeiro acesso", () => {
    it("deve criar token de reset com 7 dias de expiração", async () => {
      const token = generateResetToken();
      const hashedToken = hashToken(token);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      const resetToken = await prisma.passwordResetToken.create({
        data: {
          token: hashedToken,
          usuarioId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(resetToken.token).toBe(hashedToken);
      expect(resetToken.usuarioId).toBe(usuarioId);
      expect(resetToken.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it("deve recuperar token por hash", async () => {
      const token = generateResetToken();
      const hashedToken = hashToken(token);

      const created = await prisma.passwordResetToken.create({
        data: {
          token: hashedToken,
          usuarioId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const found = await prisma.passwordResetToken.findUnique({
        where: { token: hashedToken },
      });

      expect(found).toBeDefined();
      expect(found?.token).toBe(created.token);
    });
  });

  describe("UsuarioEstabelecimento com senhaTemporaria", () => {
    it("deve criar usuário de estabelecimento com senhaTemporaria=true", async () => {
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Novo Consultor com Estab",
          email: `consultor-estab-${Date.now()}@test.com`,
          senhaHash: await hash("auto123", 12),
          tipo: "CONSULTOR",
          senhaTemporaria: true,
        },
      });

      const consultor = await prisma.consultor.create({
        data: {
          usuarioId: usuario.id,
          cpf: "98765432100",
        },
      });

      // Criar estabelecimento
      const estab = await prisma.estabelecimento.create({
        data: {
          consultorId: consultor.id,
          nomeFantasia: "Teste Estab",
          email: `estab-${Date.now()}@test.com`,
        },
      });

      // Criar usuário de estabelecimento
      const usuarioEstab = await prisma.usuarioEstabelecimento.create({
        data: {
          estabelecimentoId: estab.id,
          email: `estab-user-${Date.now()}@test.com`,
          senhaHash: await hash("12345", 12),
          nome: "Responsável Estab",
          tipo: "PROPRIETARIO",
          senhaTemporaria: true,
        },
      });

      expect(usuarioEstab.senhaTemporaria).toBe(true);
      expect(usuarioEstab.tipo).toBe("PROPRIETARIO");
      usuarioEstabelecimentoId = usuarioEstab.id;
      estabelecimentoId = estab.id;
    });

    it("deve permitir atualizar senhaTemporaria de UsuarioEstabelecimento para false", async () => {
      const updated = await prisma.usuarioEstabelecimento.update({
        where: { id: usuarioEstabelecimentoId },
        data: { senhaTemporaria: false },
      });

      expect(updated.senhaTemporaria).toBe(false);
    });

    it("deve criar token de reset para UsuarioEstabelecimento", async () => {
      const token = generateResetToken();
      const hashedToken = hashToken(token);

      const resetToken = await prisma.passwordResetToken.create({
        data: {
          token: hashedToken,
          usuarioEstabelecimentoId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      expect(resetToken.token).toBe(hashedToken);
      expect(resetToken.usuarioEstabelecimentoId).toBe(
        usuarioEstabelecimentoId,
      );
    });
  });

  describe("Validações de CPF & Email", () => {
    it("deve validar unicidade de email entre Usuario e UsuarioEstabelecimento", async () => {
      const email = `unique-test-${Date.now()}@test.com`;

      // Criar usuário
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Test User",
          email,
          senhaHash: await hash("password", 12),
          tipo: "CONSULTOR",
        },
      });

      // Tentar criar outro com mesmo email deve falhar
      try {
        await prisma.usuario.create({
          data: {
            nome: "Another User",
            email,
            senhaHash: await hash("password", 12),
            tipo: "CONSULTOR",
          },
        });
        expect.fail("Should have thrown unique constraint error");
      } catch (error: any) {
        expect(error.code).toBe("P2002"); // Unique constraint
      }
    });

    it("deve validar unicidade de CPF em Consultor", async () => {
      const cpf = "11111111111";
      const usuario = await prisma.usuario.create({
        data: {
          nome: "CPF Test User",
          email: `cpf-test-${Date.now()}@test.com`,
          senhaHash: await hash("password", 12),
          tipo: "CONSULTOR",
        },
      });

      await prisma.consultor.create({
        data: {
          usuarioId: usuario.id,
          cpf,
        },
      });

      // Criar outro usuário
      const usuario2 = await prisma.usuario.create({
        data: {
          nome: "CPF Test User 2",
          email: `cpf-test-2-${Date.now()}@test.com`,
          senhaHash: await hash("password", 12),
          tipo: "CONSULTOR",
        },
      });

      // Tentar usar mesmo CPF deve falhar
      try {
        await prisma.consultor.create({
          data: {
            usuarioId: usuario2.id,
            cpf,
          },
        });
        expect.fail("Should have thrown unique constraint error");
      } catch (error: any) {
        expect(error.code).toBe("P2002"); // Unique constraint
      }
    });
  });
});
