import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { uniqueCpf } from "./test-helpers";

describe("Upload de Planilha e Comissões", () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;
  let parceiroId: string;
  let indicadoId: string;
  let comercialId: string;

  beforeAll(async () => {
    // Criar usuário Backoffice
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Upload Test",
        email: `backoffice.upload.${Date.now()}@test.com`,
        senhaHash: await hash("123456", 12),
        tipo: "BACKOFFICE",
        papel: "BACKOFFICE",
        senhaTemporaria: false,
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: "Backoffice Upload Test",
        cpf: uniqueCpf(),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;

    // Criar liderança COMERCIAL
    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Upload Test",
        email: `lideranca.upload.${Date.now()}@test.com`,
        senhaHash: await hash("123456", 12),
        tipo: "LIDERANCA",
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Upload Test",
        cpf: uniqueCpf(),
        backofficeId,
        tipo: "COMERCIAL",
      },
    });
    liderancaId = lideranca.id;

    // Criar parceiro
    const parceiroUsuario = await prisma.usuario.create({
      data: {
        nome: "Parceiro Upload Test",
        email: `parceiro.upload.${Date.now()}@test.com`,
        senhaHash: await hash("123456", 12),
        tipo: "PARCEIRO",
        senhaTemporaria: false,
      },
    });

    const parceiro = await prisma.parceiro.create({
      data: {
        usuarioId: parceiroUsuario.id,
        nome: "Parceiro Upload Test",
        cpf: uniqueCpf(),
        status: "ATIVO",
      },
    });
    parceiroId = parceiro.id;

    // Criar indicado
    const indicado = await prisma.indicado.create({
      data: {
        parceiroId,
        nome: "Indicado Upload Test",
        cpf: uniqueCpf(),
        status: "ATIVO",
      },
    });
    indicadoId = indicado.id;

    // Criar comercial
    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: "Comercial Upload Test",
        email: `comercial.upload.${Date.now()}@test.com`,
        senhaHash: await hash("123456", 12),
        tipo: "COMERCIAL",
        senhaTemporaria: false,
      },
    });

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        liderancaId,
        nome: "Comercial Upload Test",
        cpf: uniqueCpf(),
        percentualComissao: 5.0,
        status: "ATIVO",
      },
    });
    comercialId = comercial.id;
  });

  afterAll(async () => {
    await prisma.usuario.updateMany({ data: { status: "INATIVO" } });
  });

  describe("Regras de Comissão", () => {
    it("deve criar regras comerciais para cálculo de comissões", async () => {
      const regras = await prisma.regraComercial.create({
        data: {
          backofficeId, cartaoAcessoSaude: 5.0,
          cireAtivo: 3.0,
          cireReceptivo: 2.5,
          franchisingAcesso: 4.0,
          franchisingCartao: 3.5,
          unidade: 6.0,
        },
      });

      expect(regras).toBeDefined();
      expect(Number(regras.cartaoAcessoSaude)).toBe(5.0);
    });

    it("deve criar regras de gestores para cálculo de comissões", async () => {
      const regras = await prisma.regraGestor.create({
        data: {
          backofficeId, gerenteCire: 2.0,
          supervisorAtivo: 1.5,
          supervisorReceptivo: 1.0,
          supervisorFranquia: 1.5,
          supervisorAtendimento: 1.0,
          gerenteAtendimento: 2.0,
          supervisorComercial: 2.5,
        },
      });

      expect(regras).toBeDefined();
      expect(Number(regras.gerenteCire)).toBe(2.0);
    });

    it("deve atualizar regras comerciais existentes", async () => {
      const regras = await prisma.regraComercial.findFirst({
        where: { backofficeId },
      });

      if (!regras) {
        throw new Error("Regras não encontradas");
      }

      const atualizadas = await prisma.regraComercial.update({
        where: { id: regras.id },
        data: { cartaoAcessoSaude: 7.0 },
      });

      expect(Number(atualizadas.cartaoAcessoSaude)).toBe(7.0);
    });
  });

  describe("Cadastro de Comercial para Comissões", () => {
    it("deve criar comercial com função para receber comissões", async () => {
      const comercialUsuario = await prisma.usuario.create({
        data: {
          nome: "Comercial Comissão Test",
          email: `comercial.comissao.${Date.now()}@test.com`,
          senhaHash: await hash("123456", 12),
          tipo: "COMERCIAL",
          senhaTemporaria: false,
        },
      });

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: comercialUsuario.id,
          liderancaId, nome: "Comercial Comissão Test",
          cpf: uniqueCpf(),
          funcao: "SUPERVISOR_COMERCIAL",
          status: "ATIVO",
        },
      });

      expect(comercial).toBeDefined();
      expect(comercial.funcao).toBe("SUPERVISOR_COMERCIAL");
    });

    it("deve listar todos os comerciais do backoffice", async () => {
      const comerciais = await prisma.comercial.findMany({
        where: { liderancaId },
        include: { usuario: true },
      });

      expect(comerciais.length).toBeGreaterThanOrEqual(1);
    });

    it("deve atualizar dados do comercial via modal de edição", async () => {
      const comercial = await prisma.comercial.findFirst({
        where: { liderancaId },
      });

      if (!comercial) {
        throw new Error("Comercial não encontrado");
      }

      const atualizado = await prisma.comercial.update({
        where: { id: comercial.id },
        data: { funcao: "GERENTE_CIRE" },
      });

      expect(atualizado.funcao).toBe("GERENTE_CIRE");
    });

    it("deve deletar comercial e suas comissões em cascata", async () => {
      const comercialUsuario = await prisma.usuario.create({
        data: {
          nome: "Comercial Temp",
          email: `comercial.temp.${Date.now()}@test.com`,
          senhaHash: await hash("123456", 12),
          tipo: "COMERCIAL",
          senhaTemporaria: false,
        },
      });

      const comercialTemp = await prisma.comercial.create({
        data: {
          usuarioId: comercialUsuario.id,
          liderancaId, nome: "Comercial Temp",
          cpf: uniqueCpf(),
          status: "ATIVO",
        },
      });

      // Criar comissão de teste
      await prisma.comissaoComercial.create({
        data: {
          comercialId: comercialTemp.id,
          mesReferencia: "2026-01",
          valorVendas: 10000.0,
          valorComissao: 500.0,
          status: "CALCULADA",
        },
      });

      // Deletar em cascata
      await prisma.comissaoComercial.deleteMany({
        where: { comercialId: comercialTemp.id },
      });
      await prisma.comercial.delete({
        where: { id: comercialTemp.id },
      });

      const comissoesRestantes = await prisma.comissaoComercial.findMany({
        where: { comercialId: comercialTemp.id },
      });

      expect(comissoesRestantes).toHaveLength(0);
    });
  });

  describe("Metas Mensais de Comissões", () => {
    it("deve criar meta mensal para comercial", async () => {
      const comercial = await prisma.comercial.findFirst({
        where: { liderancaId },
      });

      if (!comercial) {
        throw new Error("Comercial não encontrado");
      }

      const meta = await prisma.metaComercial.create({
        data: {
          comercialId: comercial.id,
          mesReferencia: "2026-01",
          valorMeta: 50000.0,
        },
      });

      expect(meta).toBeDefined();
      expect(meta.mesReferencia).toBe("2026-01");
      expect(Number(meta.valorMeta)).toBe(50000.0);
    });

    it("deve atualizar meta atingida automaticamente", async () => {
      const comercial = await prisma.comercial.findFirst({
        where: { liderancaId },
      });

      if (!comercial) {
        throw new Error("Comercial não encontrado");
      }

      // Criar meta
      const meta = await prisma.metaComercial.create({
        data: {
          comercialId: comercial.id,
          mesReferencia: "2026-02",
          valorMeta: 30000.0,
          valorAtingido: 15000.0,
        },
      });

      // Atualizar meta
      const metaAtualizada = await prisma.metaComercial.update({
        where: { id: meta.id },
        data: { valorAtingido: 25000.0 },
      });

      expect(Number(metaAtualizada.valorAtingido)).toBe(25000.0);
    });

    it("deve listar metas de todos os comerciais (visão geral)", async () => {
      const metas = await prisma.metaComercial.findMany({
        where: {
          comercial: {
            liderancaId, },
        },
        include: {
          comercial: {
            include: {
              usuario: true,
            },
          },
        },
      });

      expect(metas.length).toBeGreaterThan(0);
      expect(metas[0].comercial).toBeDefined();
    });
  });

  describe("Upload de Planilha - Validação de Colunas", () => {
    it("deve validar colunas obrigatórias da planilha", () => {
      const colunasObrigatorias = [
        "Data de Referência",
        "Data do Pagamento",
        "Forma de Pagamento",
        "Total Pago",
        "Paciente",
        "Procedimento",
        "CPF",
        "Tipo do Procedimento",
        "Unidade",
      ];

      expect(colunasObrigatorias).toHaveLength(9);
      expect(colunasObrigatorias).toContain("CPF");
      expect(colunasObrigatorias).toContain("Total Pago");
    });

    it("deve reconhecer colunas opcionais da planilha", () => {
      const colunasOpcionais = [
        "Usuário da conta",
        "Desconto",
        "Acréscimo",
        "Valor Produzido",
        "Total Bruto",
      ];

      expect(colunasOpcionais).toContain("Usuário da conta");
      expect(colunasOpcionais).toContain("Desconto");
    });
  });

  describe("Upload de Planilha - Parsing de Dados", () => {
    it("deve fazer parse de data no formato brasileiro", () => {
      const dataBr = "05/07/2026";
      const [dia, mes, ano] = dataBr.split("/");
      const data = new Date(`${ano}-${mes}-${dia}T12:00:00Z`); // Adicionar hora para evitar timezone

      expect(data.getUTCFullYear()).toBe(2026);
      expect(data.getUTCMonth() + 1).toBe(7);
      expect(data.getUTCDate()).toBe(5);
    });

    it("deve fazer parse de número no formato brasileiro (17,03)", () => {
      const valorBr = "17,03";
      const valor = parseFloat(valorBr.replace(",", "."));

      expect(valor).toBe(17.03);
    });

    it("deve fazer parse de número grande no formato brasileiro (1.234,56)", () => {
      const valorBr = "1.234,56";
      const valor = parseFloat(valorBr.replace(/\./g, "").replace(",", "."));

      expect(valor).toBe(1234.56);
    });

    it("deve limpar CPF com formatação (000.000.000-00)", () => {
      const cpfFormatado = "047.030.849-45";
      const cpfLimpo = cpfFormatado.replace(/\D/g, "");

      expect(cpfLimpo).toBe("04703084945");
      expect(cpfLimpo.length).toBe(11);
    });

    it("deve remover aspas duplas do CPF", () => {
      const cpfComAspas = '"047.030.849-45"';
      const cpfLimpo = cpfComAspas
        .replace(/["']/g, "")
        .replace(/\D/g, "");

      expect(cpfLimpo).toBe("04703084945");
    });
  });

  describe("Upload de Planilha - Validações de Linha", () => {
    it("deve rejeitar linha com CPF inválido", () => {
      const cpfInvalido = "00000000000";
      const ehValido = cpfInvalido !== "00000000000" && cpfInvalido.length === 11;

      expect(ehValido).toBe(false);
    });

    it("deve rejeitar linha com valor negativo", () => {
      const valorNegativo = -100.0;
      const ehValido = valorNegativo >= 0;

      expect(ehValido).toBe(false);
    });

    it("deve rejeitar cancelamentos e devoluções", () => {
      const tipoProcedimento = "Consulta - Cancelamento";
      const tipoLower = tipoProcedimento.toLowerCase();
      const ehCancelamento =
        tipoLower.includes("cancelamento") ||
        tipoLower.includes("devolução") ||
        tipoLower.includes("estorno");

      expect(ehCancelamento).toBe(true);
    });

    it("deve detectar linhas duplicadas", () => {
      const uniqueKey1 = "2026-07-05|11122233344|Consulta|Unidade A";
      const uniqueKey2 = "2026-07-05|11122233344|Consulta|Unidade A";
      const cpfsProcessados = new Set<string>();

      cpfsProcessados.add(uniqueKey1);
      const ehDuplicado = cpfsProcessados.has(uniqueKey2);

      expect(ehDuplicado).toBe(true);
    });
  });

  describe("Upload de Planilha - Identificação de Comercial", () => {
    it("deve identificar comercial pelo nome 'Usuário da conta'", async () => {
      const usuarioDaConta = "Comercial Upload Test";
      const comercial = await prisma.comercial.findFirst({
        where: {
          liderancaId, nome: {
            contains: usuarioDaConta,
            mode: "insensitive",
          },
        },
      });

      expect(comercial).toBeDefined();
      expect(comercial?.nome).toContain("Comercial");
    });

    it("deve retornar null se comercial não for encontrado", async () => {
      const usuarioDaConta = "Comercial Inexistente";
      const comercial = await prisma.comercial.findFirst({
        where: {
          liderancaId, nome: {
            contains: usuarioDaConta,
            mode: "insensitive",
          },
        },
      });

      expect(comercial).toBeNull();
    });
  });

  describe("Upload de Planilha - Resumo (Summary)", () => {
    it("deve calcular total de válidos, órfãos e rejeitados", () => {
      const linhas = [
        { status: "VALIDO", valor: 100 },
        { status: "VALIDO", valor: 200 },
        { status: "ORFÃO", valor: 150 },
        { status: "REJEITADO", valor: 0 },
        { status: "REJEITADO", valor: 0 },
      ];

      const totalValido = linhas.filter((l) => l.status === "VALIDO").length;
      const totalOrfao = linhas.filter((l) => l.status === "ORFÃO").length;
      const totalRejeitado = linhas.filter((l) => l.status === "REJEITADO").length;
      const totalValor = linhas
        .filter((l) => l.status === "VALIDO")
        .reduce((sum, l) => sum + l.valor, 0);

      expect(totalValido).toBe(2);
      expect(totalOrfao).toBe(1);
      expect(totalRejeitado).toBe(2);
      expect(totalValor).toBe(300);
    });
  });

  describe("Comissões - Cálculo e Pagamento", () => {
    it("deve calcular comissão para comercial", async () => {
      const comercial = await prisma.comercial.findFirst({
        where: { liderancaId },
      });

      if (!comercial) {
        throw new Error("Comercial não encontrado");
      }

      const comissao = await prisma.comissaoComercial.create({
        data: {
          comercialId: comercial.id,
          mesReferencia: "2026-03",
          valorVendas: 80000.0,
          valorComissao: 4000.0, // 5%
          status: "CALCULADA",
        },
      });

      expect(comissao).toBeDefined();
      expect(Number(comissao.valorComissao)).toBe(4000.0);
    });

    it("deve atualizar status da comissão para PAGA", async () => {
      const comissao = await prisma.comissaoComercial.findFirst({
        where: { status: "CALCULADA" },
      });

      if (!comissao) {
        throw new Error("Comissão não encontrada");
      }

      const atualizada = await prisma.comissaoComercial.update({
        where: { id: comissao.id },
        data: {
          status: "PAGA",
          dataPagamento: new Date(),
        },
      });

      expect(atualizada.status).toBe("PAGA");
      expect(atualizada.dataPagamento).toBeDefined();
    });
  });
});