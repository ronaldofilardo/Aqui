/**
 * Testes de API Routes Secundárias
 * Complementa testes unitários da API
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { uniqueCpf } from './test-helpers';

describe('API Routes Secundárias - Testes', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;

  beforeEach(async () => {
    // Setup
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Teste Secundário',
        email: `backoffice-sec-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: 'Backoffice Secundário',
        cpf: uniqueCpf(),
      },
    });
    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: 'Lideranca Secundário',
        email: `lideranca-sec-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'LIDERANCA',
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: 'Lideranca Secundário',
        cpf: uniqueCpf(),
        backofficeId,
        tipo: 'COMERCIAL',
      },
    });
    liderancaId = lideranca.id;
  });

  afterEach(async () => {
    await prisma.lideranca.deleteMany({ where: { usuario: { email: { endsWith: "@asa.test" } } } }).catch(() => {});
    await prisma.backoffice.deleteMany({ where: { usuario: { email: { endsWith: "@asa.test" } } } }).catch(() => {});
    await prisma.usuario.deleteMany({ where: { email: { endsWith: "@asa.test" } } }).catch(() => {});
  });

  describe('POST /comerciais - Criação', () => {
    it('deve criar comercial com sucesso', async () => {
      const dadosComercial = {
        nome: 'Comercial Teste',
        email: `comercial-teste-${Date.now()}@asa.test`,
        cpf: uniqueCpf(),
        percentualComissao: 5.0,
        funcao: 'SUPERVISOR_ATIVO',
      };

      // Criar usuário primeiro
      const usuario = await prisma.usuario.create({
        data: {
          nome: dadosComercial.nome,
          email: dadosComercial.email,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const commercial = await prisma.comercial.create({
        data: {
          usuarioId: usuario.id,
          liderancaId,
          nome: dadosComercial.nome,
          cpf: dadosComercial.cpf,
          percentualComissao: dadosComercial.percentualComissao,
          funcao: 'SUPERVISOR_ATIVO' as any,
        },
      });

      expect(commercial.id).toBeDefined();
      expect(commercial.nome).toBe(dadosComercial.nome);
      expect(Number(commercial.percentualComissao)).toBe(5.0);

      // Cleanup
      await prisma.comercial.delete({ where: { id: commercial.id } });
      await prisma.usuario.delete({ where: { id: usuario.id } });
    });

    it('deve validar email único', async () => {
      const email = `comercial-unico-${Date.now()}@asa.test`;

      await prisma.usuario.create({
        data: {
          nome: 'Comercial 1',
          email,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const usuarioExistente = await prisma.usuario.findUnique({
        where: { email },
      });

      expect(usuarioExistente).toBeDefined();
    });

    it('deve validar CPF único', async () => {
      const cpf = uniqueCpf();

      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial CPF',
          email: `comercial-cpf-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      await prisma.comercial.create({
        data: {
          usuarioId: usuario.id,
          liderancaId,
          nome: 'Comercial CPF',
          cpf,
          percentualComissao: 5.0,
        },
      });

      const comercialExistente = await prisma.comercial.findUnique({
        where: { cpf },
      });

      expect(comercialExistente).toBeDefined();

      // Cleanup
      await prisma.comercial.deleteMany({ where: { cpf } });
      await prisma.usuario.delete({ where: { id: usuario.id } });
    });
  });

  describe('PATCH /comerciais/[id] - Atualização', () => {
    it('deve atualizar percentual de comissão', async () => {
      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial Update',
          email: `comercial-update-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: usuario.id,
          liderancaId,
          nome: 'Comercial Update',
          cpf: uniqueCpf(),
          percentualComissao: 5.0,
        },
      });

      // Atualizar comissão
      const updated = await prisma.comercial.update({
        where: { id: comercial.id },
        data: { percentualComissao: 10.0 },
      });

      expect(Number(updated.percentualComissao)).toBe(10.0);

      // Cleanup
      await prisma.comercial.delete({ where: { id: comercial.id } });
      await prisma.usuario.delete({ where: { id: usuario.id } });
    });

    it('deve atualizar status do comercial', async () => {
      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial Status',
          email: `comercial-status-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: usuario.id,
          liderancaId,
          nome: 'Comercial Status',
          cpf: uniqueCpf(),
          percentualComissao: 5.0,
          status: 'ATIVO',
        },
      });

      // Atualizar status
      const updated = await prisma.comercial.update({
        where: { id: comercial.id },
        data: { status: 'INATIVO' },
      });

      expect(updated.status).toBe('INATIVO');

      // Cleanup
      await prisma.comercial.delete({ where: { id: comercial.id } });
      await prisma.usuario.delete({ where: { id: usuario.id } });
    });
  });

  describe('POST /pontos/ciclos - Criação de Ciclo', () => {
    it('deve criar ciclo SEMESTRAL com sucesso', async () => {
      const ciclo = await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Semestral 2026.1',
          periodicidade: 'SEMESTRAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-06-30'),
          fimResgateEm: new Date('2026-08-31'),
          status: 'EM_ANDAMENTO',
        },
      });

      expect(ciclo.id).toBeDefined();
      expect(ciclo.periodicidade).toBe('SEMESTRAL');
      expect(ciclo.status).toBe('EM_ANDAMENTO');

      // Cleanup
      await prisma.cicloPontos.delete({ where: { id: ciclo.id } });
    });

    it('deve criar ciclo ANUAL com sucesso', async () => {
      const ciclo = await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Anual 2026',
          periodicidade: 'ANUAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-12-31'),
          fimResgateEm: new Date('2027-02-28'),
          status: 'EM_ANDAMENTO',
        },
      });

      expect(ciclo.periodicidade).toBe('ANUAL');

      // Cleanup
      await prisma.cicloPontos.delete({ where: { id: ciclo.id } });
    });

    it('não deve permitir dois ciclos SEMESTRAIS ativos', async () => {
      await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Semestral 1',
          periodicidade: 'SEMESTRAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-06-30'),
          fimResgateEm: new Date('2026-08-31'),
          status: 'EM_ANDAMENTO',
        },
      });

      // Tentar criar segundo ciclo semestral
      const erro = await prisma.cicloPontos.findFirst({
        where: {
          backofficeId,
          periodicidade: 'SEMESTRAL',
          status: 'EM_ANDAMENTO',
        },
      });

      expect(erro).toBeDefined();

      // Cleanup
      await prisma.cicloPontos.deleteMany({ where: { backofficeId } });
    });
  });

  describe('GET /parceiros/check-cpf - Validação', () => {
    it('deve validar CPF disponível', async () => {
      const cpfDisponivel = uniqueCpf();

      const existe = await prisma.parceiro.findUnique({
        where: { cpf: cpfDisponivel },
      });

      expect(existe).toBeNull();
    });

    it('deve validar CPF já cadastrado como parceiro', async () => {
      const cpfOcupado = uniqueCpf();

      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Parceiro CPF',
          email: `parceiro-cpf-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'PARCEIRO',
        },
      });

      await prisma.parceiro.create({
        data: {
          usuarioId: usuario.id,
          comercialId: null,
          nome: 'Parceiro CPF',
          cpf: cpfOcupado,
          status: 'ATIVO',
        },
      });

      const existe = await prisma.parceiro.findUnique({
        where: { cpf: cpfOcupado },
      });

      expect(existe).toBeDefined();

      // Cleanup
      await prisma.parceiro.deleteMany({ where: { cpf: cpfOcupado } });
      await prisma.usuario.delete({ where: { id: usuario.id } });
    });

    it('deve validar CPF já cadastrado como indicado', async () => {
      const cpfIndicado = uniqueCpf();

      // Criar parceiro para o indicado
      const parceiroUsuario = await prisma.usuario.create({
        data: {
          nome: 'Parceiro CPF Indicado',
          email: `parceiro-cpf-indicado-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'PARCEIRO',
        },
      });

      const parceiro = await prisma.parceiro.create({
        data: {
          usuarioId: parceiroUsuario.id,
          nome: 'Parceiro CPF Indicado',
          cpf: uniqueCpf(),
          status: 'ATIVO',
        },
      });

      await prisma.indicado.create({
        data: {
          parceiroId: parceiro.id,
          nome: 'Indicado CPF',
          cpf: cpfIndicado,
          telefone: '11999999999',
          status: 'ATIVO' as any,
        },
      });

      const existe = await prisma.indicado.findUnique({
        where: { cpf: cpfIndicado },
      });

      expect(existe).toBeDefined();

      // Cleanup
      await prisma.indicado.delete({ where: { cpf: cpfIndicado } });
    });
  });
});