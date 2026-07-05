import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock do Prisma para isolar testes do utils.ts (sem precisar de DB real)
const configFindFirstMock = vi.fn();
const cicloFindFirstMock = vi.fn();

vi.mock("@asa/database", () => ({
  prisma: {
    configuracaoPontos: {
      findFirst: (...args: unknown[]) => configFindFirstMock(...args),
    },
    cicloPontos: {
      findFirst: (...args: unknown[]) => cicloFindFirstMock(...args),
    },
  },
}));

import {
  normalizarCPF,
  validarCPF,
  calcularPontosDeProducao,
  obterCicloVigente,
} from "@/lib/pontos-utils";

describe("normalizarCPF", () => {
  it("remove caracteres não numéricos", () => {
    expect(normalizarCPF("530.511.739-91")).toBe("53051173991");
  });

  it("mantém apenas dígitos mesmo com espaços", () => {
    expect(normalizarCPF(" 530 511 739 91 ")).toBe("53051173991");
  });

  it("retorna vazio se entrada vazia", () => {
    expect(normalizarCPF("")).toBe("");
  });

  it("retorna string vazia quando caracteres não-numéricos", () => {
    expect(normalizarCPF("abc.def-ghi")).toBe("");
  });
});

describe("validarCPF (helper de pontos-utils)", () => {
  it("valida CPF correto", () => {
    expect(validarCPF("530.511.739-91")).toBe(true);
  });

  it("rejeita CPF com todos os dígitos iguais", () => {
    expect(validarCPF("00000000000")).toBe(false);
  });

  it("rejeita CPF de tamanho incorreto", () => {
    expect(validarCPF("123")).toBe(false);
  });
});

describe("calcularPontosDeProducao", () => {
  beforeEach(() => {
    configFindFirstMock.mockReset();
  });

  it("calcula pontos com arredondamento padrão (round)", async () => {
    configFindFirstMock.mockResolvedValueOnce({
      valorPorPonto: { toNumber: () => 10 },
      tipoArredondamento: "PADRAO",
    });

    // R$ 100 / R$ 10/pp = 10 pontos
    const pontos = await calcularPontosDeProducao(
      100,
      new Date("2026-07-15"),
      "gp-id",
    );
    expect(pontos).toBe(10);
  });

  it("arredonda para baixo com tipoArredondamento PISO", async () => {
    configFindFirstMock.mockResolvedValueOnce({
      valorPorPonto: { toNumber: () => 7 },
      tipoArredondamento: "PISO",
    });

    // 50 / 7 = 7.14 → PISO = 7
    const pontos = await calcularPontosDeProducao(
      50,
      new Date("2026-07-15"),
      "gp-id",
    );
    expect(pontos).toBe(7);
  });

  it("arredonda para cima com tipoArredondamento TETO", async () => {
    configFindFirstMock.mockResolvedValueOnce({
      valorPorPonto: { toNumber: () => 7 },
      tipoArredondamento: "TETO",
    });

    // 50 / 7 = 7.14 → TETO = 8
    const pontos = await calcularPontosDeProducao(
      50,
      new Date("2026-07-15"),
      "gp-id",
    );
    expect(pontos).toBe(8);
  });

  it("arredonda para o inteiro mais próximo (PADRÃO) em valor fracionário ", async () => {
    configFindFirstMock.mockResolvedValueOnce({
      valorPorPonto: { toNumber: () => 7 },
      tipoArredondamento: "PADRAO",
    });

    // 50 / 7 = 7.14 → round = 7
    const pontos = await calcularPontosDeProducao(
      50,
      new Date("2026-07-15"),
      "gp-id",
    );
    expect(pontos).toBe(7);
  });

  it("lança erro se não houver configuração vigente", async () => {
    configFindFirstMock.mockResolvedValueOnce(null);

    await expect(
      calcularPontosDeProducao(100, new Date("2026-07-15"), "gp-id"),
    ).rejects.toThrow(
      "Configuração de pontos não encontrada para a data de referência",
    );
  });

  it("aceita totalPago como Decimal (Prisma)", async () => {
    class DecimalLike {
      v: number;
      constructor(v: number) {
        this.v = v;
      }
      toNumber() {
        return this.v;
      }
    }
    configFindFirstMock.mockResolvedValueOnce({
      valorPorPonto: new DecimalLike(10),
      tipoArredondamento: "PADRAO",
    });

    const pontos = await calcularPontosDeProducao(
      // simula um Decimal com toNumber (Prisma Decimal)
      { toNumber: () => 100 } as unknown as number,
      new Date("2026-07-15"),
      "gp-id",
    );
    expect(pontos).toBe(10);
  });

  it("retorna no mínimo 0 (não negativo)", async () => {
    configFindFirstMock.mockResolvedValueOnce({
      valorPorPonto: { toNumber: () => 1000 },
      tipoArredondamento: "PADRAO",
    });

    const pontos = await calcularPontosDeProducao(
      5, // 5 / 1000 = 0.005 → round = 0
      new Date("2026-07-15"),
      "gp-id",
    );
    expect(pontos).toBe(0);
  });
});

describe("obterCicloVigente", () => {
  beforeEach(() => {
    cicloFindFirstMock.mockReset();
  });

  it("retorna ciclo SEMESTRAL vigente quando informada a periodicidade", async () => {
    const ciclo = { id: "c1", periodicidade: "SEMESTRAL" };
    cicloFindFirstMock.mockResolvedValueOnce(ciclo);

    const result = await obterCicloVigente("gp-id", "SEMESTRAL");
    expect(result).toBe(ciclo);
    expect(cicloFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          gestorPfId: "gp-id",
          periodicidade: "SEMESTRAL",
        }),
      }),
    );
  });

  it("retorna ciclo ANUAL vigente quando informada a periodicidade", async () => {
    const ciclo = { id: "c2", periodicidade: "ANUAL" };
    cicloFindFirstMock.mockResolvedValueOnce(ciclo);

    const result = await obterCicloVigente("gp-id", "ANUAL");
    expect(result).toBe(ciclo);
    expect(cicloFindFirstMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ periodicidade: "ANUAL" }),
      }),
    );
  });

  it("quando periodicidade NÃO é informada, deixa o filtro em aberto", async () => {
    const ciclo = { id: "c3", periodicidade: "ANUAL" };
    cicloFindFirstMock.mockResolvedValueOnce(ciclo);

    const result = await obterCicloVigente("gp-id");
    expect(result).toBe(ciclo);

    const whereArg = cicloFindFirstMock.mock.calls[0][0]?.where;
    expect(whereArg.periodicidade).toBeUndefined();
  });

  it("retorna null quando não há ciclo vigente", async () => {
    cicloFindFirstMock.mockResolvedValueOnce(null);
    const result = await obterCicloVigente("gp-id", "ANUAL");
    expect(result).toBeNull();
  });
});
