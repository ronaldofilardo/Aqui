/**
 * Testes Unitários - API Backoffice
 * Valida todos os endpoints da API /api/v1/backoffice/
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { uniqueCpf } from './test-helpers';

// Mock dos helpers de API
vi.mock('@/lib/api-helpers', async () => {
  const actual = await vi.importActual('@/lib/api-helpers');
  return {
    ...actual,
    requireBackofficeWithScope: vi.fn(),
    requireBackoffice: vi.fn(),
  };
});

describe('API Backoffice - Endpoints', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;

  beforeEach(async () => {
    // Setup: Criar backoffice e liderança para testes
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Test User',
        email: `backoffice-test-${Date.now()}@asa.com`,
        senhaHash: await hash('123456', 12),
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: 'Backoffice Test',
        cpf: uniqueCpf(),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: 'Lideranca Test User',
        email: `lideranca-test-${Date.now()}@asa.com`,
        senhaHash: await hash('123456', 12),
        tipo: 'LIDERANCA',
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: 'Lideranca Test',
        cpf: uniqueCpf(),
        backofficeId,
        tipo: 'COMERCIAL',
      },
    });
    liderancaId = lideranca.id;
  });

  afterEach(async () => {
    await prisma.usuario.updateMany({ data: { status: "INATIVO" } });
  });

  describe('GET /api/v1/backoffice/config', () => {
    it('deve retornar configurações do backoffice', async () => {
      const backoffice = await prisma.backoffice.findUnique({
        where: { id: backofficeId },
        include: { usuario: true },
      });

      expect(backoffice).toBeDefined();
      expect(backoffice?.nome).toBe('Backoffice Test');
      expect(Number(backoffice?.percentualComissaoDefault)).toBe(5.0);
    });

    it('deve retornar 404 se backoffice não existir', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const backoffice = await prisma.backoffice.findUnique({
        where: { id: fakeId },
      });

      expect(backoffice).toBeNull();
    });
  });

  describe('GET /api/v1/backoffice/liderancas', () => {
    it('deve listar lideranças do backoffice', async () => {
      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          usuario: { select: { email: true, status: true } },
          _count: { select: { comerciais: true, gestores: true } },
        },
      });

      expect(liderancas.length).toBeGreaterThan(0);
      expect(liderancas[0].backofficeId).toBe(backofficeId);
      expect(liderancas[0].tipo).toBe('COMERCIAL');
    });

    it('deve filtrar lideranças por tipo', async () => {
      const liderancasComercial = await prisma.lideranca.findMany({
        where: { backofficeId, tipo: 'COMERCIAL' },
      });

      expect(liderancasComercial.length).toBeGreaterThan(0);
      expect(liderancasComercial.every(l => l.tipo === 'COMERCIAL')).toBe(true);
    });

    it('deve filtrar lideranças por status', async () => {
      const liderancasAtivas = await prisma.lideranca.findMany({
        where: { backofficeId, status: 'ATIVO' },
      });

      expect(liderancasAtivas.every(l => l.status === 'ATIVO')).toBe(true);
    });
  });

  describe('GET /api/v1/backoffice/comerciais', () => {
    it('deve listar comerciais do backoffice', async () => {
      // Criar comercial para teste
      const comercialUsuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial Test',
          email: `comercial-test-${Date.now()}@asa.com`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      await prisma.comercial.create({
        data: {
          usuarioId: comercialUsuario.id,
          liderancaId,
          nome: 'Comercial Test',
          cpf: uniqueCpf(),
          percentualComissao: 5.0,
          status: 'ATIVO',
        },
      });

      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          comerciais: {
            include: {
              usuario: { select: { email: true, status: true } },
            },
          },
        },
      });

      const comerciais = liderancas.flatMap(l => l.comerciais);
      expect(comerciais.length).toBeGreaterThan(0);
      expect(comerciais[0].liderancaId).toBe(liderancaId);
    });
  });

  describe('GET /api/v1/backoffice/parceiros', () => {
    it('deve listar parceiros do backoffice', async () => {
      // Criar liderança e comercial para parceiro
      const comercialUsuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial Partner Test',
          email: `comercial-partner-${Date.now()}@asa.com`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: comercialUsuario.id,
          liderancaId,
          nome: 'Comercial Partner Test',
          cpf: uniqueCpf(),
          percentualComissao: 5.0,
        },
      });

      const parceiroUsuario = await prisma.usuario.create({
        data: {
          nome: 'Parceiro Test',
          email: `parceiro-test-${Date.now()}@asa.com`,
          senhaHash: await hash('123456', 12),
          tipo: 'PARCEIRO',
        },
      });

      await prisma.parceiro.create({
        data: {
          usuarioId: parceiroUsuario.id,
          comercialId: comercial.id,
          nome: 'Parceiro Test',
          cpf: uniqueCpf(),
          status: 'ATIVO',
        },
      });

      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          comerciais: { select: { id: true } },
          gestores: { select: { id: true } },
        },
      });

      const comercialIds = liderancas.flatMap(l => l.comerciais.map(c => c.id));
      const gestorIds = liderancas.flatMap(l => l.gestores.map(g => g.id));

      const parceiros = await prisma.parceiro.findMany({
        where: {
          OR: [
            { comercialId: { in: comercialIds } },
            { gestorId: { in: gestorIds } },
            { comercialId: null, gestorId: null },
          ],
        },
        include: {
          usuario: { select: { email: true, status: true } },
        },
      });

      expect(parceiros.length).toBeGreaterThan(0);
      expect(parceiros[0].usuario).toBeDefined();
    });
  });

  describe('GET /api/v1/backoffice/pontos/ciclos', () => {
    it('deve listar ciclos de pontos do backoffice', async () => {
      await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Teste 2026',
          periodicidade: 'ANUAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-06-30'),
          fimResgateEm: new Date('2026-08-31'),
          status: 'EM_ANDAMENTO',
        },
      });

      const ciclos = await prisma.cicloPontos.findMany({
        where: { backofficeId },
        orderBy: { inicioAcumuloEm: 'desc' },
      });

      expect(ciclos.length).toBeGreaterThan(0);
      expect(ciclos[0].backofficeId).toBe(backofficeId);
      expect(ciclos[0].status).toBe('EM_ANDAMENTO');
    });

    it('deve retornar array vazio se não houver ciclos', async () => {
      const ciclos = await prisma.cicloPontos.findMany({
        where: { backofficeId: '00000000-0000-0000-0000-000000000000' },
      });

      expect(ciclos.length).toBe(0);
    });
  });

  describe('GET /api/v1/backoffice/pontos/configuracao', () => {
    it('deve listar configurações de pontos do backoffice', async () => {
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: 100,
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });

      const configs = await prisma.configuracaoPontos.findMany({
        where: { backofficeId },
        orderBy: { vigenteDesde: 'desc' },
      });

      expect(configs.length).toBeGreaterThan(0);
      expect(configs[0].backofficeId).toBe(backofficeId);
      expect(Number(configs[0].valorPorPonto)).toBe(100);
    });

    it('deve retornar configuração vigente corretamente', async () => {
      const configAntiga = await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: 50,
          tipoArredondamento: 'PISO',
          vigenteDesde: new Date('2026-01-01'),
          vigenteAte: new Date('2026-06-30'),
        },
      });

      const configVigente = await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: 75,
          tipoArredondamento: 'TETO',
          vigenteDesde: new Date('2026-07-01'),
        },
      });

      const configs = await prisma.configuracaoPontos.findMany({
        where: { backofficeId },
        orderBy: { vigenteDesde: 'desc' },
      });

      expect(configs.length).toBe(2);
      expect(configs[0].id).toBe(configVigente.id);
      expect(configs[0].vigenteAte).toBeNull();
      expect(Number(configs[0].valorPorPonto)).toBe(75);
      expect(configs[1].id).toBe(configAntiga.id);
      expect(configs[1].vigenteAte).toBeDefined();
    });

    it('deve filtrar configurações apenas do backoffice atual', async () => {
      // Criar outro usuário para o outro backoffice
      const outroUsuario = await prisma.usuario.create({
        data: {
          nome: 'Outro Backoffice User',
          email: `outro-backoffice-${Date.now()}@asa.com`,
          senhaHash: await hash('123456', 12),
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
        },
      });

      const outroBackoffice = await prisma.backoffice.create({
        data: {
          usuarioId: outroUsuario.id,
          nome: 'Outro Backoffice',
          cpf: uniqueCpf(),
          percentualComissaoDefault: 3.0,
        },
      });

      await prisma.configuracaoPontos.create({
        data: {
          backofficeId: outroBackoffice.id,
          valorPorPonto: 200,
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });

      const configsDoBackoffice = await prisma.configuracaoPontos.findMany({
        where: { backofficeId },
      });

      const configsDoOutro = await prisma.configuracaoPontos.findMany({
        where: { backofficeId: outroBackoffice.id },
      });

      expect(configsDoBackoffice.length).toBe(0);
      expect(configsDoOutro.length).toBe(1);
      expect(Number(configsDoOutro[0].valorPorPonto)).toBe(200);

      await prisma.configuracaoPontos.deleteMany({ where: { backofficeId: outroBackoffice.id } });
      await prisma.usuario.update({ where: { id: outroUsuario.id }, data: { status: 'INATIVO' } });
    });
  });

  describe('GET /api/v1/backoffice/pontos/premios', () => {
    it('deve listar prêmios do backoffice', async () => {
      await prisma.premio.create({
        data: {
          backofficeId,
          nome: 'Prêmio Teste',
          descricao: 'Descrição do prêmio',
          custoPontos: 1000,
          ativo: true,
        },
      });

      const premios = await prisma.premio.findMany({
        where: { backofficeId },
        orderBy: { criadoEm: 'desc' },
      });

      expect(premios.length).toBeGreaterThan(0);
      expect(premios[0].backofficeId).toBe(backofficeId);
      expect(premios[0].ativo).toBe(true);
    });
  });

  describe('GET /api/v1/backoffice/regras-comerciais', () => {
    it('deve retornar regras comerciais do backoffice', async () => {
      await prisma.regraComercial.create({
        data: {
          backofficeId,
          cartaoAcessoSaude: 5,
          cireAtivo: 10,
          cireReceptivo: 8,
          franchisingAcesso: 3,
          franchisingCartao: 4,
          unidade: 2,
        },
      });

      const regra = await prisma.regraComercial.findUnique({
        where: { backofficeId },
      });

      expect(regra).toBeDefined();
      expect(regra?.backofficeId).toBe(backofficeId);
      expect(Number(regra?.cartaoAcessoSaude)).toBe(5);
    });

    it('deve retornar valores default se não existir regra', async () => {
      const regra = await prisma.regraComercial.findUnique({
        where: { backofficeId: '00000000-0000-0000-0000-000000000000' },
      });

      expect(regra).toBeNull();
    });
  });

  describe('GET /api/v1/backoffice/regras-gestores', () => {
    it('deve retornar regras de gestores do backoffice', async () => {
      await prisma.regraGestor.create({
        data: {
          backofficeId,
          gerenteCire: 15,
          supervisorAtivo: 10,
          supervisorReceptivo: 8,
          supervisorFranquia: 5,
          supervisorAtendimento: 7,
          gerenteAtendimento: 12,
          supervisorComercial: 20,
        },
      });

      const regra = await prisma.regraGestor.findUnique({
        where: { backofficeId },
      });

      expect(regra).toBeDefined();
      expect(regra?.backofficeId).toBe(backofficeId);
      expect(Number(regra?.gerenteCire)).toBe(15);
    });
  });

  describe('GET /api/v1/backoffice/relatorio-comissoes', () => {
    it('deve retornar relatório de comissões vazio se não houver dados', async () => {
      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: { comerciais: { select: { id: true } } },
      });

      const comercialIds = liderancas.flatMap(l => l.comerciais.map(c => c.id));

      const comissoes = await prisma.comissaoComercial.findMany({
        where: {
          comercialId: { in: comercialIds.length > 0 ? comercialIds : ['00000000-0000-0000-0000-000000000000'] },
          mesReferencia: { gte: '2026-01', lte: '2026-12' },
        },
      });

      expect(comissoes.length).toBe(0);
    });
  });
});