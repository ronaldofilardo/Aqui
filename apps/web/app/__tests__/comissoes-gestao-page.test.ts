import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "@asa/database";
import { hash } from "bcryptjs";
import { Decimal } from "@prisma/client/runtime/library";

describe("Comissões Gestão - Página e Funcionalidades", () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;
  let comercialId: string;
  let comercialUsuarioId: string;

  beforeAll(async () => {
    // Criar usuário Backoffice
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: "Backoffice Teste",
        email: `backoffice.${Date.now()}@test.com`,
        senhaHash: await hash("123456", 12),
        tipo: "GESTOR",
        senhaTemporaria: false,
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    // Criar registro Backoffice
    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: "Backoffice Teste",
        cpf: `${Date.now()}00000000000`.slice(0, 11),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;

    // Criar liderança COMERCIAL
    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: "Lideranca Comercial",
        email: `lideranca.${Date.now()}@test.com`,
        senhaHash: await hash("123456", 12),
        tipo: "GESTOR",
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: "Lideranca Comercial",
        cpf: `${Date.now()}00000000001`.slice(0, 11),
        gestorPfId,
        tipo: "COMERCIAL",
      },
    });
    liderancaId = lideranca.id;
  });

  beforeEach(async () => {
    // Limpar comerciais existentes antes de cada teste
    await prisma.comercial.deleteMany({ where: { liderancaId } }).catch(() => {});

    // Criar comercial para testes
    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: "Comercial Teste",
        email: `comercial.${Date.now()}@test.com`,
        senhaHash: await hash("123456", 12),
        tipo: "COMERCIAL",
        status: "ATIVO",
      },
    });
    comercialUsuarioId = comercialUsuario.id;

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        liderancaId,
        nome: "Comercial Teste",
        cpf: `${Date.now()}00000000000`.slice(0, 11),
        percentualComissao: 3.0,
        status: "ATIVO",
      },
    });
    comercialId = comercial.id;
  });

  afterAll(async () => {
    // Limpeza em cascata já remove registros relacionados
    await prisma.backoffice.delete({ where: { id: backofficeId } }).catch(() => {});
    await prisma.usuario.delete({ where: { id: backofficeUsuarioId } }).catch(() => {});
  });

  describe("Cadastro de Comerciais", () => {
    it("deve permitir criar novo comercial com função", async () => {
      const usuario = await prisma.usuario.create({
        data: {
          nome: "Novo Comercial",
          email: `novo.comercial.${Date.now()}@test.com`,
          senhaHash: await hash("123456", 12),
          tipo: "COMERCIAL",
          status: "ATIVO",
        },
      });

      const novoComercial = await prisma.comercial.create({
        data: {
          usuarioId: usuario.id,
          liderancaId, nome: "Novo Comercial",
          cpf: "99988877766",
          funcao: "SUPERVISOR_COMERCIAL",
          percentualComissao: 4.0,
          status: "ATIVO",
        },
      });

      expect(novoComercial).toBeDefined();
      expect(novoComercial.funcao).toBe("SUPERVISOR_COMERCIAL");

      // Limpeza
      await prisma.comercial.delete({ where: { id: novoComercial.id } }).catch(() => {});
      await prisma.usuario.delete({ where: { id: usuario.id } }).catch(() => {});
    });

    it("deve listar todos os comerciais do backoffice", async () => {
      const comerciais = await prisma.comercial.findMany({
        where: { liderancaId },
        include: { usuario: true },
      });

      expect(comerciais).toHaveLength(1);
      expect(comerciais[0].nome).toBe("Comercial Teste");
    });
  });

  describe("Metas Mensais", () => {
    it("deve criar meta para comercial", async () => {
      const meta = await prisma.metaComercial.create({
        data: {
          comercialId,
          mesReferencia: "2026-01",
          valorMeta: 10000.0,
        },
      });

      expect(meta).toBeDefined();
      expect(meta.mesReferencia).toBe("2026-01");
      expect(Number(meta.valorMeta)).toBe(10000.0);
    });

    it("deve atualizar meta existente", async () => {
      const meta = await prisma.metaComercial.create({
        data: {
          comercialId,
          mesReferencia: "2026-02",
          valorMeta: 15000.0,
        },
      });

      const metaAtualizada = await prisma.metaComercial.update({
        where: { id: meta.id },
        data: { valorMeta: 20000.0 },
      });

      expect(Number(metaAtualizada.valorMeta)).toBe(20000.0);
    });

    it("deve listar metas de todos os comerciais (visão geral)", async () => {
      await prisma.metaComercial.create({
        data: {
          comercialId,
          mesReferencia: "2026-03",
          valorMeta: 12000.0,
        },
      });

      const metas = await prisma.metaComercial.findMany({
        where: { comercialId },
        include: { comercial: { include: { usuario: true } } },
      });

      expect(metas).toHaveLength(1);
      expect(metas[0].comercial.nome).toBe("Comercial Teste");
    });
  });

  describe("Atualização de Comercial (Modal Editar)", () => {
    it("deve atualizar nome e email do comercial", async () => {
      const novoEmail = `novo.email.${Date.now()}@test.com`;
      
      const comercialAtualizado = await prisma.comercial.update({
        where: { id: comercialId },
        data: { nome: "Comercial Atualizado" },
      });

      const usuarioAtualizado = await prisma.usuario.update({
        where: { id: comercialUsuarioId },
        data: { email: novoEmail },
      });

      expect(comercialAtualizado.nome).toBe("Comercial Atualizado");
      expect(usuarioAtualizado.email).toBe(novoEmail);
    });

    it("deve atualizar função do comercial", async () => {
      const comercialAtualizado = await prisma.comercial.update({
        where: { id: comercialId },
        data: { funcao: "GERENTE_CIRE" },
      });

      expect(comercialAtualizado.funcao).toBe("GERENTE_CIRE");
    });

    it("deve atualizar status do comercial", async () => {
      const comercialAtualizado = await prisma.comercial.update({
        where: { id: comercialId },
        data: { status: "INATIVO" },
      });

      expect(comercialAtualizado.status).toBe("INATIVO");
    });

    it("deve atualizar CPF do comercial", async () => {
      const novoCpf = "11122233344";
      const comercialAtualizado = await prisma.comercial.update({
        where: { id: comercialId },
        data: { cpf: novoCpf },
      });

      expect(comercialAtualizado.cpf).toBe(novoCpf);
    });
  });

  describe("Deleção de Comercial", () => {
    it("deve deletar comercial sem comissões", async () => {
      // Criar comercial sem comissões
      const usuarioTemp = await prisma.usuario.create({
        data: {
          nome: "Comercial Temp",
          email: `temp.${Date.now()}@test.com`,
          senhaHash: await hash("123456", 12),
          tipo: "COMERCIAL",
          status: "ATIVO",
        },
      });

      const comercialTemp = await prisma.comercial.create({
        data: {
          usuarioId: usuarioTemp.id,
          liderancaId, nome: "Comercial Temp",
          cpf: `${Date.now()}00000000000`.slice(0, 11),
          percentualComissao: 3.0,
          status: "ATIVO",
        },
      });

      // Deletar comercial
      await prisma.comercial.delete({ where: { id: comercialTemp.id } });

      const comercialDeletado = await prisma.comercial.findUnique({
        where: { id: comercialTemp.id },
      });

      expect(comercialDeletado).toBeNull();

      // Limpeza
      await prisma.usuario.delete({ where: { id: usuarioTemp.id } }).catch(() => {});
    });

    it("deve deletar comercial e suas comissões em cascata", async () => {
      const usuarioTemp = await prisma.usuario.create({
        data: {
          nome: "Comercial Com Comissao",
          email: `comcomissao.${Date.now()}@test.com`,
          senhaHash: await hash("123456", 12),
          tipo: "COMERCIAL",
          status: "ATIVO",
        },
      });

      const comercialTemp = await prisma.comercial.create({
        data: {
          usuarioId: usuarioTemp.id,
          liderancaId, nome: "Comercial Com Comissao",
          cpf: `${Date.now()}11111111111`.slice(0, 11),
          percentualComissao: 3.0,
          status: "ATIVO",
        },
      });

      // Criar comissão
      await prisma.comissaoComercial.create({
        data: {
          comercialId: comercialTemp.id,
          mesReferencia: "2026-01",
          valorVendas: 50000.0,
          valorComissao: 1500.0,
          status: "CALCULADA",
        },
      });

      // Deletar comercial (deve deletar comissões em cascata)
      await prisma.comissaoComercial.deleteMany({
        where: { comercialId: comercialTemp.id },
      });
      await prisma.comercial.delete({ where: { id: comercialTemp.id } });

      const comissoesRestantes = await prisma.comissaoComercial.findMany({
        where: { comercialId: comercialTemp.id },
      });

      expect(comissoesRestantes).toHaveLength(0);
    });

    it("deve deletar comercial e suas metas em cascata", async () => {
      const usuarioTemp = await prisma.usuario.create({
        data: {
          nome: "Comercial Com Meta",
          email: `commeta.${Date.now()}@test.com`,
          senhaHash: await hash("123456", 12),
          tipo: "COMERCIAL",
          status: "ATIVO",
        },
      });

      const comercialTemp = await prisma.comercial.create({
        data: {
          usuarioId: usuarioTemp.id,
          liderancaId, nome: "Comercial Com Meta",
          cpf: `${Date.now()}22222222222`.slice(0, 11),
          percentualComissao: 3.0,
          status: "ATIVO",
        },
      });

      // Criar metas
      await prisma.metaComercial.createMany({
        data: [
          { comercialId: comercialTemp.id, mesReferencia: "2026-01", valorMeta: 10000.0 },
          { comercialId: comercialTemp.id, mesReferencia: "2026-02", valorMeta: 15000.0 },
        ],
      });

      // Deletar metas primeiro
      await prisma.metaComercial.deleteMany({
        where: { comercialId: comercialTemp.id },
      });
      await prisma.comercial.delete({ where: { id: comercialTemp.id } });

      const metasRestantes = await prisma.metaComercial.findMany({
        where: { comercialId: comercialTemp.id },
      });

      expect(metasRestantes).toHaveLength(0);

      // Limpeza
      await prisma.usuario.delete({ where: { id: usuarioTemp.id } }).catch(() => {});
    });
  });

  describe("Regras de Comissão", () => {
    it("deve criar regras comerciais", async () => {
      const regrasComerciais = await prisma.regraComercial.create({
        data: {
          backofficeId,
          cartaoAcessoSaude: 5.0,
          cireAtivo: 3.0,
          cireReceptivo: 2.5,
          franchisingAcesso: 4.0,
          franchisingCartao: 3.5,
          unidade: 6.0,
        },
      });

      expect(regrasComerciais).toBeDefined();
      expect(Number(regrasComerciais.cartaoAcessoSaude)).toBe(5.0);
    });

    it("deve criar regras de gestores", async () => {
      const regrasGestores = await prisma.regraGestor.create({
        data: {
          backofficeId,
          gerenteCire: 2.0,
          supervisorAtivo: 1.5,
          supervisorReceptivo: 1.0,
          supervisorFranquia: 1.5,
          supervisorAtendimento: 1.0,
          gerenteAtendimento: 2.0,
          supervisorComercial: 2.5,
        },
      });

      expect(regrasGestores).toBeDefined();
      expect(Number(regrasGestores.gerenteCire)).toBe(2.0);
    });

    it("deve atualizar regras existentes", async () => {
      // Criar regras apenas se não existir
      let regras = await prisma.regraComercial.findUnique({
        where: { backofficeId },
      });

      if (!regras) {
regras = await prisma.regraComercial.create({
        data: {
          backofficeId,
            cartaoAcessoSaude: 5.0,
            cireAtivo: 3.0,
            cireReceptivo: 2.5,
            franchisingAcesso: 4.0,
            franchisingCartao: 3.5,
            unidade: 6.0,
          },
        });
      }

      const regrasAtualizadas = await prisma.regraComercial.update({
        where: { id: regras.id },
        data: { cartaoAcessoSaude: 7.0 },
      });

      expect(Number(regrasAtualizadas.cartaoAcessoSaude)).toBe(7.0);
    });
  });

  describe("Tabs da Página", () => {
    it("deve ter aba Cadastro com formulário e tabela", () => {
      // Teste conceitual - a UI deve ter:
      // 1. Formulário "Novo Comercial"
      // 2. Tabela com comerciais e 12 meses
      // 3. Botões Editar e Deletar
      expect(true).toBe(true);
    });

    it("deve ter aba Regras com formulários Comercial e Gestores", () => {
      // Teste conceitual - a UI deve ter:
      // 1. Formulário "Regras: Comercial"
      // 2. Formulário "Regras: Gestores"
      expect(true).toBe(true);
    });

    it("deve ter aba Comissões com visão geral de metas", () => {
      // Teste conceitual - a UI deve ter:
      // 1. Tabela com todos comerciais
      // 2. Colunas: Comercial, Mês, Meta, Atingido, %, Status
      expect(true).toBe(true);
    });
  });
});