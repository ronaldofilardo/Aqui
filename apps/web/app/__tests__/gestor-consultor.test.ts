import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";

let _cpfSeq = 0;
const uniqueCpf = () => {
  _cpfSeq++;
  return `${Date.now()}${_cpfSeq}${Math.floor(Math.random() * 1000)}`.slice(0, 11).padStart(11, "0");
};

describe("GestorConsultor - Hierarchy & Authorization", () => {
  let gestorId: string;
  let consultorId: string;

  beforeAll(async () => {
    await prisma.estabelecimento.deleteMany({}).catch(() => {});
    await prisma.gestorConsultor.deleteMany({}).catch(() => {});
    await prisma.consultor.deleteMany({}).catch(() => {});
    await prisma.usuario.deleteMany({}).catch(() => {});

    const gestor = await prisma.usuario.create({
      data: {
        nome: "Gestor Teste",
        email: `gestor-test-${Date.now()}@test.com`,
        senhaHash: "hash123",
        tipo: "LIDERANCA",
      },
    });
    gestorId = gestor.id;

    const usuario = await prisma.usuario.create({
      data: {
        nome: "Consultor Teste",
        email: `consultor-test-${Date.now()}@test.com`,
        senhaHash: "hash123",
        tipo: "CONSULTOR",
      },
    });

    const consultor = await prisma.consultor.create({
      data: {
        usuarioId: usuario.id,
        cpf: uniqueCpf(),
      },
    });
    consultorId = consultor.id;
  });

  afterAll(async () => {
    await prisma.usuario.updateMany({ data: { status: "INATIVO" } });
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
          tipo: "LIDERANCA",
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
          tipo: "LIDERANCA",
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
          cpf: uniqueCpf(),
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
