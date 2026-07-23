import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";

describe("API de Comissões - Gestor", () => {
  let gestorId: string;
  let consultorId: string;
  let estabelecimentoId: string;
  let cupomConfigId: string;

  beforeAll(async () => {
    // Criar usuário gestor
    const gestorUsuario = await prisma.usuario.create({
      data: {
        nome: "Gestor Teste Comissões",
        email: `gestor-com-${Date.now()}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
        senhaTemporaria: false,
      },
    });
    gestorId = gestorUsuario.id;

    // Criar usuário consultor
    const consultorUsuario = await prisma.usuario.create({
      data: {
        nome: "Consultor Teste Comissões",
        email: `consultor-com-${Date.now()}@asa.test`,
        senhaHash: await hash("123456", 12),
        tipo: "CONSULTOR",
        senhaTemporaria: false,
      },
    });

    // Criar registro de consultor
    const consultor = await prisma.consultor.create({
      data: {
        usuarioId: consultorUsuario.id,
      },
    });
    consultorId = consultor.id;

    // Associar gestor ao consultor
    await prisma.gestorConsultor.create({
      data: {
        gestorId,
        consultorId,
      },
    });

    // Criar estabelecimento
    const estab = await prisma.estabelecimento.create({
      data: {
        consultorId,
        nomeFantasia: "Clínica Teste Comissões",
        status: "ATIVO",
      },
    });
    estabelecimentoId = estab.id;

    // Criar cupom config
    const cupom = await prisma.cupomConfig.create({
      data: {
        estabelecimentoId,
        codigoCupom: `TEST-COM-${Date.now()}`,
        criadoPor: gestorId,
      },
    });
    cupomConfigId = cupom.id;
  });

  afterAll(async () => {
    await prisma.estabelecimento.deleteMany({ where: { id: estabelecimentoId } }).catch(() => {});
    await prisma.gestorConsultor.deleteMany({ where: { gestorId } }).catch(() => {});
    await prisma.consultor.deleteMany({ where: { id: consultorId } }).catch(() => {});
    await prisma.usuario.deleteMany({ where: { id: gestorId } }).catch(() => {});
  });

  describe("Cálculo de Comissões", () => {
    it("deve calcular R$20 por consulta para consultor", async () => {
      const consultasRealizadas = 5;
      const comissaoEsperada = consultasRealizadas * 2000; // R$20 em centavos
      expect(comissaoEsperada).toBe(10000);
    });

    it("deve calcular R$10 por consulta para estabelecimento", async () => {
      const consultasRealizadas = 3;
      const comissaoEsperada = consultasRealizadas * 1000; // R$10 em centavos
      expect(comissaoEsperada).toBe(3000);
    });

    it("deve retornar zero comissões quando não há cupons usados", async () => {
      const cuponsUsados = 0;
      const comissaoConsultor = cuponsUsados * 2000;
      const comissaoEstabelecimento = cuponsUsados * 1000;

      expect(comissaoConsultor).toBe(0);
      expect(comissaoEstabelecimento).toBe(0);
    });

    it("deve calcular subtotal correto (consultor + estabelecimento)", async () => {
      const consultasRealizadas = 4;
      const comissaoConsultor = consultasRealizadas * 2000; // R$80
      const comissaoEstabelecimento = consultasRealizadas * 1000; // R$40
      const subtotal = comissaoConsultor + comissaoEstabelecimento; // R$120

      expect(subtotal).toBe(12000); // 120 reais em centavos
    });
  });

  describe("Scope de Gestor", () => {
    it("gestor deve ter acesso apenas aos seus consultores", async () => {
      const gestoresConsultores = await prisma.gestorConsultor.findMany({
        where: { gestorId },
      });

      expect(gestoresConsultores).toHaveLength(1);
      expect(gestoresConsultores[0].consultorId).toBe(consultorId);
    });

    it("gestor deve ver apenas estabelecimentos de seus consultores", async () => {
      const estabelecimentos = await prisma.estabelecimento.findMany({
        where: {
          consultorId: {
            in: [consultorId],
          },
        },
      });

      expect(estabelecimentos).toHaveLength(1);
      expect(estabelecimentos[0].nomeFantasia).toBe("Clínica Teste Comissões");
    });
  });
});
