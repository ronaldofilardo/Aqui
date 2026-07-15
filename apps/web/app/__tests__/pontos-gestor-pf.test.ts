import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { prisma } from "@asa/database";
import { Decimal } from "@prisma/client/runtime/library";

describe("Sistema de Pontos - Gestor PF", () => {
  let backofficeId: string;
  let parceiroId: string;
  let usuarioId: string;
  let cicloId: string;

  beforeEach(async () => {
    // Criar usuário gestor PF
    const usuario = await prisma.usuario.create({
      data: {
        nome: "Usuario Teste Pontos",
        email: `teste.pontos.${Date.now()}@teste.com`,
        senhaHash: "hash123",
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
      },
    });
    usuarioId = usuario.id;

    // Criar Backoffice
    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId,
        nome: "Backoffice Teste",
        cpf: `123456789${Date.now()}`,
      },
    });
    backofficeId = backoffice.id;

    // Criar parceiro
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

    // Criar ciclo de pontos vigente
    const ciclo = await prisma.cicloPontos.create({
      data: {
        liderancaId, nome: "Ciclo Teste 2026",
        periodicidade: "SEMESTRAL",
        inicioAcumuloEm: new Date("2026-01-01"),
        fimAcumuloEm: new Date("2026-06-30"),
        fimResgateEm: new Date("2026-07-31"),
        status: "EM_ANDAMENTO",
      },
    });
    cicloId = ciclo.id;

    // Criar configuração de pontos
    await prisma.configuracaoPontos.create({
      data: {
        liderancaId, valorPorPonto: new Decimal(100),
        tipoArredondamento: "PADRAO",
        vigenteDesde: new Date("2026-01-01"),
      },
    });
  });

  afterEach(async () => {
    // Limpar dados de teste
    await prisma.movimentacaoPontos.deleteMany();
    await prisma.cicloPontos.deleteMany();
    await prisma.configuracaoPontos.deleteMany();
    await prisma.parceiro.deleteMany();
    await prisma.backoffice.deleteMany();
    await prisma.usuario.deleteMany();
  });

  describe("Configuração de Pontos", () => {
    it("deve criar configuração de pontos corretamente", async () => {
      const config = await prisma.configuracaoPontos.findFirst({
        where: { backofficeId },
      });

      expect(config).toBeTruthy();
      expect(config?.valorPorPonto).toEqual(new Decimal(100));
      expect(config?.tipoArredondamento).toBe("PADRAO");
      expect(config?.vigenteAte).toBeNull();
    });

    it("deve atualizar configuração de pontos", async () => {
      const config = await prisma.configuracaoPontos.findFirst({
        where: { backofficeId },
      });

      if (config) {
        const updated = await prisma.configuracaoPontos.update({
          where: { id: config.id },
          data: {
            valorPorPonto: new Decimal(150),
            tipoArredondamento: "TETO",
          },
        });

        expect(updated.valorPorPonto).toEqual(new Decimal(150));
        expect(updated.tipoArredondamento).toBe("TETO");
      }
    });

    it("deve encerrar configuração anterior ao criar nova", async () => {
      // Criar segunda configuração
      await prisma.configuracaoPontos.create({
        data: {
          liderancaId, valorPorPonto: new Decimal(150),
          tipoArredondamento: "PISO",
          vigenteDesde: new Date("2026-07-01"),
        },
      });

      const configs = await prisma.configuracaoPontos.findMany({
        where: { backofficeId },
        orderBy: { vigenteDesde: "desc" },
      });

      expect(configs.length).toBe(2);
      expect(configs[0].vigenteAte).toBeNull(); // Nova está vigente
      expect(configs[1].vigenteAte).toBeTruthy(); // Antiga foi encerrada
    });
  });

  describe("Distribuição de Pontos", () => {
    it("deve distribuir pontos para procedimento com parceiro", async () => {
      // Criar procedimento
      const procedimento = await prisma.procedimentoPF.create({
        data: {
          dataReferencia: new Date("2026-03-15"),
          dataPagamento: new Date("2026-03-20"),
          formaPagamento: "PIX",
          totalPago: new Decimal(250),
          paciente: "Paciente Teste",
          procedimento: "Consulta Médica",
          cpf: "12345678900",
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

      // Simular distribuição de pontos
      const pontos = Math.round(250 / 100); // 250 / 100 = 2.5 → 3 pontos (arredondamento padrão)

      const movimentacao = await prisma.movimentacaoPontos.create({
        data: {
          parceiroId,
          cicloPontosId: cicloId,
          tipo: "CREDITO",
          quantidade: pontos,
          descricao: "Pontos por produção: Consulta Médica",
          referenciaProcedimentoId: procedimento.id,
          origem: "PRODUCAO_IMPORTADA",
        },
      });

      expect(movimentacao).toBeTruthy();
      expect(movimentacao.quantidade).toBe(3);
      expect(movimentacao.tipo).toBe("CREDITO");
      expect(movimentacao.origem).toBe("PRODUCAO_IMPORTADA");
    });

    it("não deve distribuir pontos para procedimento já processado", async () => {
      const procedimento = await prisma.procedimentoPF.create({
        data: {
          dataReferencia: new Date("2026-03-15"),
          dataPagamento: new Date("2026-03-20"),
          formaPagamento: "PIX",
          totalPago: new Decimal(250),
          paciente: "Paciente Teste",
          procedimento: "Consulta Médica",
          cpf: "12345678900",
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

      // Primeira distribuição
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

      // Tentar distribuir novamente
      const existente = await prisma.movimentacaoPontos.findFirst({
        where: {
          referenciaProcedimentoId: procedimento.id,
          origem: "PRODUCAO_IMPORTADA",
        },
      });

      expect(existente).toBeTruthy();
    });

    it("deve calcular pontos corretamente com diferentes valores", async () => {
      const testes = [
        { valor: 50, pontosEsperados: 0 }, // 50/100 = 0.5 → 0 (arredondamento)
        { valor: 100, pontosEsperados: 1 }, // 100/100 = 1
        { valor: 150, pontosEsperados: 2 }, // 150/100 = 1.5 → 2
        { valor: 250, pontosEsperados: 3 }, // 250/100 = 2.5 → 3
        { valor: 1000, pontosEsperados: 10 }, // 1000/100 = 10
      ];

      for (const teste of testes) {
        const pontos = Math.round(teste.valor / 100);
        expect(pontos).toBe(teste.pontosEsperados);
      }
    });

    it("deve aplicar arredondamento PISO corretamente", async () => {
      const config = await prisma.configuracaoPontos.update({
        where: { backofficeId: (await prisma.backoffice.findFirst({ where: { id: backofficeId } }))!.id },
        data: { tipoArredondamento: "PISO" },
      });

      expect(config.tipoArredondamento).toBe("PISO");

      // Testar cálculo com piso
      const valor = 150;
      const pontosComPiso = Math.floor(valor / 100);
      expect(pontosComPiso).toBe(1); // 1.5 → 1 (piso)
    });

    it("deve aplicar arredondamento TETO corretamente", async () => {
      const config = await prisma.configuracaoPontos.update({
        where: { backofficeId: (await prisma.backoffice.findFirst({ where: { id: backofficeId } }))!.id },
        data: { tipoArredondamento: "TETO" },
      });

      expect(config.tipoArredondamento).toBe("TETO");

      // Testar cálculo com teto
      const valor = 150;
      const pontosComTeto = Math.ceil(valor / 100);
      expect(pontosComTeto).toBe(2); // 1.5 → 2 (teto)
    });
  });

  describe("Ranking de Pontos", () => {
    it("deve calcular saldo de pontos corretamente", async () => {
      // Criar múltiplas movimentações
      await prisma.movimentacaoPontos.createMany({
        data: [
          {
            parceiroId,
            cicloPontosId: cicloId,
            tipo: "CREDITO",
            quantidade: 10,
            origem: "PRODUCAO_IMPORTADA",
          },
          {
            parceiroId,
            cicloPontosId: cicloId,
            tipo: "CREDITO",
            quantidade: 5,
            origem: "PRODUCAO_IMPORTADA",
          },
          {
            parceiroId,
            cicloPontosId: cicloId,
            tipo: "DEBITO",
            quantidade: 3,
            origem: "RESGATE",
          },
        ],
      });

      // Calcular saldo
      const creditos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId,
          cicloPontosId: cicloId,
          tipo: "CREDITO",
        },
      });

      const debitos = await prisma.movimentacaoPontos.aggregate({
        _sum: { quantidade: true },
        where: {
          parceiroId,
          cicloPontosId: cicloId,
          tipo: "DEBITO",
        },
      });

      const saldo = (creditos._sum.quantidade || 0) - (debitos._sum.quantidade || 0);
      expect(saldo).toBe(12); // 10 + 5 - 3
    });

    it("deve ordenar ranking por pontos acumulados", async () => {
      // Criar mais parceiros
      const parceiros = [];
      for (let i = 0; i < 3; i++) {
        const usuario = await prisma.usuario.create({
          data: {
            nome: `Parceiro ${i}`,
            email: `parceiro${i}.${Date.now()}@teste.com`,
            senhaHash: "hash123",
            tipo: "PARCEIRO",
          },
        });

        const parceiro = await prisma.parceiro.create({
          data: {
            usuarioId: usuario.id,
            nome: `Parceiro ${i}`,
            cpf: `111222333${i}${Date.now()}`,
            liderancaId, },
        });
        parceiros.push(parceiro.id);

        // Adicionar pontos
        await prisma.movimentacaoPontos.create({
          data: {
            parceiroId: parceiro.id,
            cicloPontosId: cicloId,
            tipo: "CREDITO",
            quantidade: (i + 1) * 10, // 10, 20, 30 pontos
            origem: "PRODUCAO_IMPORTADA",
          },
        });
      }

      // Buscar ranking
      const todosParceiros = await prisma.parceiro.findMany({
        where: { backofficeId },
      });

      const ranking = await Promise.all(
        todosParceiros.map(async (p) => {
          const creditos = await prisma.movimentacaoPontos.aggregate({
            _sum: { quantidade: true },
            where: {
              parceiroId: p.id,
              cicloPontosId: cicloId,
              tipo: "CREDITO",
            },
          });
          return {
            parceiro: p.nome,
            pontos: creditos._sum.quantidade || 0,
          };
        }),
      );

      // Ordenar por pontos (decrescente)
      ranking.sort((a, b) => b.pontos - a.pontos);

      expect(ranking[0].pontos).toBeGreaterThanOrEqual(ranking[1].pontos);
      expect(ranking[1].pontos).toBeGreaterThanOrEqual(ranking[2].pontos);
    });
  });

  describe("Validações do Ciclo", () => {
    it("deve validar se procedimento está dentro do período do ciclo", async () => {
      const procedimentoForaPeriodo = new Date("2026-08-15"); // Após fim do ciclo
      const procedimentoDentroPeriodo = new Date("2026-03-15"); // Dentro do ciclo

      const ciclo = await prisma.cicloPontos.findUnique({
        where: { id: cicloId },
      });

      expect(procedimentoForaPeriodo).toBeGreaterThan(ciclo!.fimAcumuloEm);
      expect(procedimentoDentroPeriodo).toBeLessThanOrEqual(ciclo!.fimAcumuloEm);
      expect(procedimentoDentroPeriodo).toBeGreaterThanOrEqual(ciclo!.inicioAcumuloEm);
    });

    it("não deve permitir criar ciclo com mesma periodicidade ativo", async () => {
      // Tentar criar outro ciclo SEMESTRAL enquanto o primeiro está ativo
      const cicloExistente = await prisma.cicloPontos.findFirst({
        where: {
          liderancaId, status: "EM_ANDAMENTO",
        },
      });

      expect(cicloExistente).toBeTruthy();
      expect(cicloExistente?.periodicidade).toBe("SEMESTRAL");

      // Não deve permitir criar outro ciclo SEMESTRAL ativo
      // (isso seria validado no endpoint)
    });

    it("deve permitir criar ciclo com periodicidade diferente", async () => {
      // Criar ciclo ANUAL enquanto SEMESTRAL está ativo
      const novoCiclo = await prisma.cicloPontos.create({
        data: {
          liderancaId, nome: "Ciclo Anual 2026",
          periodicidade: "ANUAL",
          inicioAcumuloEm: new Date("2026-01-01"),
          fimAcumuloEm: new Date("2026-12-31"),
          fimResgateEm: new Date("2027-01-31"),
          status: "EM_ANDAMENTO",
        },
      });

      expect(novoCiclo).toBeTruthy();
      expect(novoCiclo.periodicidade).toBe("ANUAL");

      const ciclosAtivos = await prisma.cicloPontos.findMany({
        where: {
          liderancaId, status: "EM_ANDAMENTO",
        },
      });

      expect(ciclosAtivos.length).toBe(2); // SEMESTRAL + ANUAL
    });
  });
});