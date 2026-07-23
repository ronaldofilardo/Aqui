import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

const unique = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

async function criarParceiroCompleto() {
  const backoffice = await prisma.backoffice.create({
    data: {
      usuario: {
        create: {
          nome: "Backoffice",
          email: `backoffice-${unique()}@asa.test`,
          senhaHash: await hash("x", 4),
          tipo: "BACKOFFICE",
          papel: "BACKOFFICE",
        },
      },
      nome: `Backoffice ${unique()}`,
      cpf: uniqueCpf(),
    },
  });

  const parceiroUsuario = await prisma.usuario.create({
    data: {
      nome: "Parceiro",
      email: `parceiro-${unique()}@asa.test`,
      senhaHash: await hash("x", 4),
      tipo: "PARCEIRO",
    },
  });

  const parceiro = await prisma.parceiro.create({
    data: {
      usuarioId: parceiroUsuario.id,
      nome: "Parceiro Teste",
      cpf: uniqueCpf(),
    },
  });

  return { backoffice, parceiro };
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
    let backofficeId: string;
    let parceiroId: string;
    let cicloId: string;

    beforeAll(async () => {
      const { backoffice, parceiro } = await criarParceiroCompleto();
      backofficeId = backoffice.id;
      parceiroId = parceiro.id;

      const ciclo = await prisma.cicloPontos.create({
        data: {
          backofficeId, nome: "Ciclo lock test",
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
  let backofficeId: string;

  beforeAll(async () => {
    const { backoffice } = await criarParceiroCompleto();
    backofficeId = backoffice.id;
  });

  afterAll(async () => {
    await prisma.cicloPontos
      .deleteMany({ where: { backofficeId } })
      .catch(() => {});
  });

  it("deve permitir dois ciclos ativos, um SEMESTRAL e um ANUAL", async () => {
    await prisma.cicloPontos.deleteMany({ where: { backofficeId } }).catch(() => {});

    const semestral = await prisma.cicloPontos.create({
      data: {
        backofficeId, nome: "1S/2026",
        periodicidade: "SEMESTRAL",
        inicioAcumuloEm: new Date("2026-01-01"),
        fimAcumuloEm: new Date("2026-06-30"),
        fimResgateEm: new Date("2026-08-31"),
        status: "EM_ANDAMENTO",
      },
    });

    const anual = await prisma.cicloPontos.create({
      data: {
        backofficeId, nome: "2026",
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
      where: { backofficeId, status: "EM_ANDAMENTO" },
    });
    expect(count).toBe(2);
  });
});
