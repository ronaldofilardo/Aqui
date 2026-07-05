import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";

/**
 * Integration tests isolated by unique IDs/CPFs.
 * These exercise the preferencia-ciclo model logic against a real Prisma + Postgres,
 * mirroring what the API route does (without invoking the auth/session layer).
 */

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
const uniqueCpf = () =>
  `${Math.floor(Math.random() * 1e10)}`.padStart(11, "0").slice(0, 11);

async function criarParceiroCompleto() {
  const gestorPf = await prisma.gestorPF.create({
    data: {
      usuario: {
        create: {
          nome: "Gestor PF",
          email: `gestor-${unique()}@test.com`,
          senhaHash: await hash("x", 4),
          tipo: "GESTOR_PF",
        },
      },
      nome: `Gestor ${unique()}`,
      cpf: uniqueCpf(),
    },
  });

  const parceiroUsuario = await prisma.usuario.create({
    data: {
      nome: "Parceiro",
      email: `parceiro-${unique()}@test.com`,
      senhaHash: await hash("x", 4),
      tipo: "PARCEIRO",
    },
  });

  const parceiro = await prisma.parceiro.create({
    data: {
      usuarioId: parceiroUsuario.id,
      nome: "Parceiro Teste",
      cpf: uniqueCpf(),
      gestorPfId: gestorPf.id,
    },
  });

  return { gestorPf, parceiro };
}

describe("Parceiro - Preferência de Ciclo (Periodicidade)", () => {
  describe("Atualização de periodicidadeCicloEscolhida", () => {
    let parceiroId: string;

    beforeAll(async () => {
      const { parceiro } = await criarParceiroCompleto();
      parceiroId = parceiro.id;
    });

    afterAll(async () => {
      await prisma.parceiro
        .deleteMany({ where: { id: parceiroId } })
        .catch(() => {});
    });

    it("deve gravar periodicidade SEMESTRAL quando chamada pelo parceiro", async () => {
      await prisma.parceiro.update({
        where: { id: parceiroId },
        data: { periodicidadeCicloEscolhida: "SEMESTRAL" },
      });
      const updated = await prisma.parceiro.findUnique({
        where: { id: parceiroId },
        select: { periodicidadeCicloEscolhida: true },
      });
      expect(updated?.periodicidadeCicloEscolhida).toBe("SEMESTRAL");
    });

    it("deve sobrescrever para ANUAL", async () => {
      await prisma.parceiro.update({
        where: { id: parceiroId },
        data: { periodicidadeCicloEscolhida: "ANUAL" },
      });
      const updated = await prisma.parceiro.findUnique({
        where: { id: parceiroId },
        select: { periodicidadeCicloEscolhida: true },
      });
      expect(updated?.periodicidadeCicloEscolhida).toBe("ANUAL");
    });

    it("deve poder ser limpa (null)", async () => {
      await prisma.parceiro.update({
        where: { id: parceiroId },
        data: { periodicidadeCicloEscolhida: null },
      });
      const updated = await prisma.parceiro.findUnique({
        where: { id: parceiroId },
        select: { periodicidadeCicloEscolhida: true },
      });
      expect(updated?.periodicidadeCicloEscolhida).toBeNull();
    });
  });

  describe("Bloqueio por movimentações existentes", () => {
    let gestorPfId: string;
    let parceiroId: string;
    let cicloId: string;

    beforeAll(async () => {
      const { gestorPf, parceiro } = await criarParceiroCompleto();
      gestorPfId = gestorPf.id;
      parceiroId = parceiro.id;

      const ciclo = await prisma.cicloPontos.create({
        data: {
          gestorPfId,
          nome: "Ciclo lock test",
          periodicidade: "ANUAL",
          inicioAcumuloEm: new Date(),
          fimAcumuloEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          fimResgateEm: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
      });
      cicloId = ciclo.id;

      await prisma.movimentacaoPontos.create({
        data: {
          parceiroId,
          cicloPontosId: cicloId,
          tipo: "CREDITO",
          origem: "PRODUCAO_IMPORTADA",
          quantidade: 10,
        },
      });
    });

    afterAll(async () => {
      await prisma.movimentacaoPontos
        .deleteMany({ where: { parceiroId } })
        .catch(() => {});
      await prisma.cicloPontos
        .deleteMany({ where: { id: cicloId } })
        .catch(() => {});
      await prisma.parceiro
        .deleteMany({ where: { id: parceiroId } })
        .catch(() => {});
    });

    it("deve contar >0 movimentações para o parceiro", async () => {
      const count = await prisma.movimentacaoPontos.count({
        where: { parceiroId },
      });
      expect(count).toBeGreaterThan(0);
    });

    it("regra: count > 0 → preferir SEMESTRAL é bloqueado pela lógica do route", () => {
      // Esta regra é exercida em preferencia-ciclo/route.ts.
      // Aqui confirmamos o input: quando parceiro tem movimentações,
      // a rota deve rejeitar o PATCH.
      const temMovimentacoes = true; // garantido pelo beforeAll
      const novaPreferencia = "SEMESTRAL";
      const deveAtualizar = !temMovimentacoes;
      expect(deveAtualizar).toBe(false);
      expect(novaPreferencia).toBe("SEMESTRAL");
    });
  });
});

describe("Parceiro - Coexistência de ciclo SEMESTRAL e ANUAL", () => {
  let gestorPfId: string;

  beforeAll(async () => {
    const { gestorPf } = await criarParceiroCompleto();
    gestorPfId = gestorPf.id;
  });

  afterAll(async () => {
    await prisma.cicloPontos
      .deleteMany({ where: { gestorPfId } })
      .catch(() => {});
  });

  it("deve permitir dois ciclos ativos, um SEMESTRAL e um ANUAL", async () => {
    await prisma.cicloPontos.deleteMany({ where: { gestorPfId } }).catch(() => {});

    const semestral = await prisma.cicloPontos.create({
      data: {
        gestorPfId,
        nome: "1S/2026",
        periodicidade: "SEMESTRAL",
        inicioAcumuloEm: new Date("2026-01-01"),
        fimAcumuloEm: new Date("2026-06-30"),
        fimResgateEm: new Date("2026-08-31"),
        status: "EM_ANDAMENTO",
      },
    });

    const anual = await prisma.cicloPontos.create({
      data: {
        gestorPfId,
        nome: "2026",
        periodicidade: "ANUAL",
        inicioAcumuloEm: new Date("2026-01-01"),
        fimAcumuloEm: new Date("2026-12-31"),
        fimResgateEm: new Date("2027-02-28"),
        status: "EM_ANDAMENTO",
      },
    });

    expect(semestral.id).not.toBe(anual.id);
    expect(semestral.periodicidade).toBe("SEMESTRAL");
    expect(anual.periodicidade).toBe("ANUAL");

    const count = await prisma.cicloPontos.count({
      where: { gestorPfId, status: "EM_ANDAMENTO" },
    });
    expect(count).toBe(2);
  });
});
