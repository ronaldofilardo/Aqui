import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { prisma } from "@asa/database";
import { Decimal } from "@prisma/client/runtime/library";
import { calcularPontosDeProducao, obterCicloVigente } from "@/lib/pontos-utils";

let _cpfSeq = 0;
const uniqueCpf = () => {
  _cpfSeq++;
  return `${Date.now()}${_cpfSeq}${Math.floor(Math.random() * 1000)}`.slice(0, 11).padStart(11, "0");
};

describe("Endpoint de Distribuição de Pontos", () => {
  let backofficeId: string;
  let parceiroId: string;
  let usuarioId: string;
  let cicloId: string;

  beforeEach(async () => {
    // Setup básico
    const usuario = await prisma.usuario.create({
      data: {
        nome: "Usuario Teste Distribuição",
        email: `teste.distribuicao.${Date.now()}@teste.com`,
        senhaHash: "hash123",
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
      },
    });
    usuarioId = usuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId,
        nome: "Backoffice Teste",
        cpf: `test${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 11),
      },
    });
    backofficeId = backoffice.id;

    const parceiroUsuario = await prisma.usuario.create({
      data: {
        nome: "Parceiro Teste",
        email: `parceiro.${Date.now()}@teste.com`,
        senhaHash: "hash123",
        tipo: "PARCEIRO",
      },
    });

    const parceiro = await prisma.parceiro.create({
      data: {
        usuarioId: parceiroUsuario.id,
        nome: "Parceiro Teste",
        cpf: `987654321${Date.now()}`,
        liderancaId, },
    });
    parceiroId = parceiro.id;

    const ciclo = await prisma.cicloPontos.create({
      data: {
        liderancaId, nome: "Ciclo Teste Distribuição",
        periodicidade: "SEMESTRAL",
        inicioAcumuloEm: new Date("2026-01-01"),
        fimAcumuloEm: new Date("2026-06-30"),
        fimResgateEm: new Date("2026-07-31"),
        status: "EM_ANDAMENTO",
      },
    });
    cicloId = ciclo.id;

    await prisma.configuracaoPontos.create({
      data: {
        liderancaId, valorPorPonto: new Decimal(100),
        tipoArredondamento: "PADRAO",
        vigenteDesde: new Date("2026-01-01"),
      },
    });
  });

  afterEach(async () => {
    await prisma.usuario.updateMany({ data: { status: "INATIVO" } });
  });

  describe("calcularPontosDeProducao", () => {
    it("deve calcular pontos com arredondamento padrão", async () => {
      const testes = [
        { totalPago: 50, pontosEsperados: 0 },
        { totalPago: 100, pontosEsperados: 1 },
        { totalPago: 150, pontosEsperados: 2 },
        { totalPago: 250, pontosEsperados: 3 },
        { totalPago: 999, pontosEsperados: 10 },
      ];

      for (const teste of testes) {
        const pontos = await calcularPontosDeProducao(
          teste.totalPago,
          new Date("2026-03-15"),
          liderancaId, );
        expect(pontos).toBe(teste.pontosEsperados);
      }
    });

    it("deve calcular pontos com arredondamento PISO", async () => {
      await prisma.configuracaoPontos.update({
        where: { backofficeId },
        data: { tipoArredondamento: "PISO" },
      });

      const pontos = await calcularPontosDeProducao(
        150,
        new Date("2026-03-15"),
        liderancaId, );
      expect(pontos).toBe(1); // 1.5 → 1 (piso)
    });

    it("deve calcular pontos com arredondamento TETO", async () => {
      await prisma.configuracaoPontos.update({
        where: { backofficeId },
        data: { tipoArredondamento: "TETO" },
      });

      const pontos = await calcularPontosDeProducao(
        150,
        new Date("2026-03-15"),
        liderancaId, );
      expect(pontos).toBe(2); // 1.5 → 2 (teto)
    });

    it("deve retornar 0 pontos para valor abaixo do mínimo", async () => {
      const pontos = await calcularPontosDeProducao(
        10,
        new Date("2026-03-15"),
        liderancaId, );
      expect(pontos).toBe(0);
    });
  });

  describe("obterCicloVigente", () => {
    it("deve retornar ciclo EM_ANDAMENTO", async () => {
      const ciclo = await obterCicloVigente(backofficeId);
      expect(ciclo).toBeTruthy();
      expect(ciclo?.status).toBe("EM_ANDAMENTO");
      expect(ciclo?.id).toBe(cicloId);
    });

    it("deve retornar ciclo RESGATE_ABERTO se não houver EM_ANDAMENTO", async () => {
      await prisma.cicloPontos.update({
        where: { id: cicloId },
        data: { status: "RESGATE_ABERTO" },
      });

      const ciclo = await obterCicloVigente(backofficeId);
      expect(ciclo).toBeTruthy();
      expect(ciclo?.status).toBe("RESGATE_ABERTO");
    });

    it("deve retornar null se não houver ciclo vigente", async () => {
      await prisma.cicloPontos.update({
        where: { id: cicloId },
        data: { status: "ENCERRADO" },
      });

      const ciclo = await obterCicloVigente(backofficeId);
      expect(ciclo).toBeNull();
    });

    it("deve filtrar por periodicidade quando especificado", async () => {
      // Criar ciclo ANUAL
      await prisma.cicloPontos.create({
        data: {
          liderancaId, nome: "Ciclo Anual",
          periodicidade: "ANUAL",
          inicioAcumuloEm: new Date("2026-01-01"),
          fimAcumuloEm: new Date("2026-12-31"),
          fimResgateEm: new Date("2027-01-31"),
          status: "EM_ANDAMENTO",
        },
      });

      // Buscar apenas SEMESTRAL
      const cicloSemestral = await obterCicloVigente(liderancaId, "SEMESTRAL");
      expect(cicloSemestral?.periodicidade).toBe("SEMESTRAL");

      // Buscar apenas ANUAL
      const cicloAnual = await obterCicloVigente(liderancaId, "ANUAL");
      expect(cicloAnual?.periodicidade).toBe("ANUAL");
    });
  });

  describe("Movimentação de Pontos", () => {
    it("deve criar movimentação de crédito por produção", async () => {
      const procedimento = await prisma.procedimentoPF.create({
        data: {
          dataReferencia: new Date("2026-03-15"),
          dataPagamento: new Date("2026-03-20"),
          formaPagamento: "PIX",
          totalPago: new Decimal(250),
          paciente: "Paciente Teste",
          procedimento: "Consulta",
          cpf: uniqueCpf(),
          tipoProcedimento: "Consulta",
          unidade: "Unidade Teste",
          parceiroId,
          uploadId: (
            await prisma.uploadPlanilhaBackoffice.create({
              data: {
                liderancaId, nomeArquivo: "teste.xlsx",
                mesReferencia: "2026-03",
              },
            })
          ).id,
        },
      });

      const pontos = await calcularPontosDeProducao(
        procedimento.totalPago,
        procedimento.dataReferencia,
        liderancaId, );

      const movimentacao = await prisma.movimentacaoPontos.create({
        data: {
          parceiroId,
          cicloPontosId: cicloId,
          tipo: "CREDITO",
          quantidade: pontos,
          descricao: `Pontos por produção: ${procedimento.procedimento}`,
          referenciaProcedimentoId: procedimento.id,
          origem: "PRODUCAO_IMPORTADA",
        },
      });

      expect(movimentacao).toBeTruthy();
      expect(movimentacao.tipo).toBe("CREDITO");
      expect(movimentacao.origem).toBe("PRODUCAO_IMPORTADA");
      expect(movimentacao.referenciaProcedimentoId).toBe(procedimento.id);
    });

    it("não deve permitir duplicidade de pontos para mesma produção", async () => {
      const procedimento = await prisma.procedimentoPF.create({
        data: {
          dataReferencia: new Date("2026-03-15"),
          dataPagamento: new Date("2026-03-20"),
          formaPagamento: "PIX",
          totalPago: new Decimal(250),
          paciente: "Paciente Teste",
          procedimento: "Consulta",
          cpf: uniqueCpf(),
          tipoProcedimento: "Consulta",
          unidade: "Unidade Teste",
          parceiroId,
          uploadId: (
            await prisma.uploadPlanilhaBackoffice.create({
              data: {
                liderancaId, nomeArquivo: "teste.xlsx",
                mesReferencia: "2026-03",
              },
            })
          ).id,
        },
      });

      // Primeira movimentação
      await prisma.movimentacaoPontos.create({
        data: {
          parceiroId,
          cicloPontosId: cicloId,
          tipo: "CREDITO",
          quantidade: 3,
          referenciaProcedimentoId: procedimento.id,
          origem: "PRODUCAO_IMPORTADA",
        },
      });

      // Verificar se já existe
      const existente = await prisma.movimentacaoPontos.findFirst({
        where: {
          referenciaProcedimentoId: procedimento.id,
          origem: "PRODUCAO_IMPORTADA",
        },
      });

      expect(existente).toBeTruthy();
    });

    it("deve permitir múltiplas produções para o mesmo parceiro", async () => {
      const producoes = [];
      for (let i = 0; i < 5; i++) {
        const proc = await prisma.procedimentoPF.create({
          data: {
            dataReferencia: new Date("2026-03-15"),
            dataPagamento: new Date("2026-03-20"),
            formaPagamento: "PIX",
            totalPago: new Decimal(100 * (i + 1)),
            paciente: `Paciente ${i}`,
            procedimento: "Consulta",
            cpf: uniqueCpf(),
            tipoProcedimento: "Consulta",
            unidade: "Unidade Teste",
            parceiroId,
            uploadId: (
              await prisma.uploadPlanilhaPF.create({
                data: {
                  liderancaId, nomeArquivo: `teste${i}.xlsx`,
                  mesReferencia: "2026-03",
                },
              })
            ).id,
          },
        });
        producoes.push(proc);
      }

      // Criar movimentações para todas
      for (const proc of producoes) {
        const pontos = await calcularPontosDeProducao(
          proc.totalPago,
          proc.dataReferencia,
          liderancaId, );

        await prisma.movimentacaoPontos.create({
          data: {
            parceiroId,
            cicloPontosId: cicloId,
            tipo: "CREDITO",
            quantidade: pontos,
            referenciaProcedimentoId: proc.id,
            origem: "PRODUCAO_IMPORTADA",
          },
        });
      }

      // Verificar total de movimentações
      const totalMovimentacoes = await prisma.movimentacaoPontos.count({
        where: {
          parceiroId,
          cicloPontosId: cicloId,
          origem: "PRODUCAO_IMPORTADA",
        },
      });

      expect(totalMovimentacoes).toBe(5);
    });
  });
});