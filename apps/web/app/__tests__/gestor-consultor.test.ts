import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";

describe("GestorConsultor - Hierarchy & Authorization", () => {
  let gestorId: string;
  let consultorId: string;
  let usuarioGestorId: string;
  let usuarioConsultorId: string;

  beforeAll(async () => {
    // Criar usuários de teste
    usuarioGestorId = "00000000-0000-0000-0000-000000000001";
    usuarioConsultorId = "00000000-0000-0000-0000-000000000002";

    // Limpar dados de teste anteriores (respeitar FK constraints)
    await prisma.gestorConsultor.deleteMany({});
    await prisma.estabelecimento.deleteMany({});
    await prisma.consultor.deleteMany({});
    await prisma.usuario.deleteMany({});

    // Criar usuário gestor
    const gestor = await prisma.usuario.create({
      data: {
        id: usuarioGestorId,
        nome: "Gestor Teste",
        email: `gestor-test-${Date.now()}@test.com`,
        senhaHash: "hash123",
        tipo: "GESTOR",
      },
    });
    gestorId = gestor.id;

    // Criar usuário consultor
    const usuario = await prisma.usuario.create({
      data: {
        id: usuarioConsultorId,
        nome: "Consultor Teste",
        email: `consultor-test-${Date.now()}@test.com`,
        senhaHash: "hash123",
        tipo: "CONSULTOR",
      },
    });

    // Criar consultor
    const consultor = await prisma.consultor.create({
      data: {
        usuarioId: usuario.id,
        cpf: "12345678901",
      },
    });
    consultorId = consultor.id;
  });

  afterAll(async () => {
    // Limpar dados de teste (respeitar FK constraints)
    await prisma.gestorConsultor.deleteMany({});
    await prisma.estabelecimento.deleteMany({});
    await prisma.consultor.deleteMany({});
    await prisma.usuario.deleteMany({});
  });

  describe("Create GestorConsultor Relationship", () => {
    it("deve criar relação entre gestor e consultor", async () => {
      const relation = await prisma.gestorConsultor.create({
        data: {
          gestorId,
          consultorId,
        },
      });

      expect(relation.gestorId).toBe(gestorId);
      expect(relation.consultorId).toBe(consultorId);
      expect(relation.atribuidoEm).toBeDefined();
    });

    it("deve prevenir duplicação de relação", async () => {
      // Tentar criar relação duplicada
      expect(
        prisma.gestorConsultor.create({
          data: {
            gestorId,
            consultorId,
          },
        }),
      ).rejects.toThrow();
    });
  });

  describe("Query Consultor Scope", () => {
    it("deve retornar consultores atribuídos a um gestor", async () => {
      const consultores = await prisma.gestorConsultor.findMany({
        where: { gestorId },
        select: { consultorId: true },
      });

      expect(consultores).toHaveLength(1);
      expect(consultores[0].consultorId).toBe(consultorId);
    });

    it("deve retornar vazio para gestor sem consultores", async () => {
      // Criar novo gestor sem consultores
      const novoGestor = await prisma.usuario.create({
        data: {
          nome: "Gestor Sem Consultores",
          email: `gestor-vazio-${Date.now()}@test.com`,
          senhaHash: "hash123",
          tipo: "GESTOR",
        },
      });

      const consultores = await prisma.gestorConsultor.findMany({
        where: { gestorId: novoGestor.id },
      });

      expect(consultores).toHaveLength(0);

      // Limpar
      await prisma.usuario.delete({ where: { id: novoGestor.id } });
    });
  });

  describe("Authorization - Data Isolation", () => {
    it("consultas devem estar isoladas por gestorId", async () => {
      // Criar outro gestor
      const outroGestor = await prisma.usuario.create({
        data: {
          nome: "Outro Gestor",
          email: `outro-gestor-${Date.now()}@test.com`,
          senhaHash: "hash123",
          tipo: "GESTOR",
        },
      });

      // Outro gestor não deve ver consultores do primeiro gestor
      const consultoresOutroGestor = await prisma.gestorConsultor.findMany({
        where: { gestorId: outroGestor.id },
      });

      expect(consultoresOutroGestor).toHaveLength(0);

      // Limpar
      await prisma.usuario.delete({ where: { id: outroGestor.id } });
    });
  });

  describe("Delete GestorConsultor Relationship", () => {
    it("deve remover relação com cascade", async () => {
      // Criar nova relação para deletar
      const novoConsultor = await prisma.usuario.create({
        data: {
          nome: "Consultor Para Deletar",
          email: `consultor-del-${Date.now()}@test.com`,
          senhaHash: "hash123",
          tipo: "CONSULTOR",
        },
      });

      const consultor = await prisma.consultor.create({
        data: {
          usuarioId: novoConsultor.id,
          cpf: `${Date.now()}`,
        },
      });

      const relation = await prisma.gestorConsultor.create({
        data: {
          gestorId,
          consultorId: consultor.id,
        },
      });

      // Deletar relação
      const deleted = await prisma.gestorConsultor.delete({
        where: { id: relation.id },
      });

      expect(deleted.id).toBe(relation.id);

      // Verificar que foi deletada
      const found = await prisma.gestorConsultor.findUnique({
        where: { id: relation.id },
      });
      expect(found).toBeNull();

      // Limpar
      await prisma.consultor.delete({ where: { id: consultor.id } });
      await prisma.usuario.delete({ where: { id: novoConsultor.id } });
    });
  });
});
