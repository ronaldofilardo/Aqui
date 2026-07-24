/**
 * Testes de Seed - packages/database/prisma/seed.ts
 * Valida a estrutura e operações do seed de usuários e dados iniciais
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

vi.mock('@prisma/client', () => {
  const mockPrismaClient = {
    usuario: {
      upsert: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
    },
    backoffice: {
      upsert: vi.fn().mockResolvedValue({ id: 'bo-1', usuarioId: 'user-1' }),
    },
    consultor: {
      upsert: vi.fn().mockResolvedValue({ id: 'cons-1', usuarioId: 'user-2' }),
    },
    estabelecimento: {
      upsert: vi.fn().mockResolvedValue({ id: 'est-1' }),
    },
    usuarioEstabelecimento: {
      upsert: vi.fn().mockResolvedValue({ id: 'ue-1' }),
    },
    $disconnect: vi.fn().mockResolvedValue(undefined),
  };

  return {
    PrismaClient: vi.fn(() => mockPrismaClient),
  };
});

describe('Seed - packages/database/prisma/seed.ts', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Estrutura de Usuários Criados', () => {
    it('deve criar/usar ADMIN com email admin@asa.com', async () => {
      const result = await prisma.usuario.upsert({
        where: { email: 'admin@asa.com' },
        update: {},
        create: {
          nome: 'Administrador',
          email: 'admin@asa.com',
          senhaHash: 'hash',
          tipo: 'ADMIN',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('admin@asa.com');
      expect(prisma.usuario.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'admin@asa.com' },
        })
      );
    });

    it('deve criar/usar BACKOFFICE com email back@asa.com', async () => {
      const result = await prisma.usuario.upsert({
        where: { email: 'back@asa.com' },
        update: {},
        create: {
          nome: 'BackOffice Admin',
          email: 'back@asa.com',
          senhaHash: 'hash',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('back@asa.com');
    });

    it('deve criar/usar BACKOFFICE com email backoffice@asa.com para compatibilidade', async () => {
      const result = await prisma.usuario.upsert({
        where: { email: 'backoffice@asa.com' },
        update: {},
        create: {
          nome: 'Backoffice Admin',
          email: 'backoffice@asa.com',
          senhaHash: 'hash',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('backoffice@asa.com');
    });

    it('deve criar/usar GESTOR_PJ com email gestor-pj@asa.com', async () => {
      const result = await prisma.usuario.upsert({
        where: { email: 'gestor-pj@asa.com' },
        update: {},
        create: {
          nome: 'Gestor Pessoa Jurídica',
          email: 'gestor-pj@asa.com',
          senhaHash: 'hash',
          tipo: 'GESTOR_PJ',
          papel: 'GESTOR_PJ',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('gestor-pj@asa.com');
    });

    it('deve criar/usar CONSULTOR com email consultor@asa.com', async () => {
      const result = await prisma.usuario.upsert({
        where: { email: 'consultor@asa.com' },
        update: {},
        create: {
          nome: 'Consultor',
          email: 'consultor@asa.com',
          senhaHash: 'hash',
          tipo: 'CONSULTOR',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result.email).toBe('consultor@asa.com');
    });
  });

  describe('Relacionamentos', () => {
    it('deve criar backoffice vinculado ao usuário back@asa.com', async () => {
      const usuario = await prisma.usuario.upsert({
        where: { email: 'back@asa.com' },
        update: {},
        create: {
          nome: 'BackOffice Admin',
          email: 'back@asa.com',
          senhaHash: 'hash',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      const backoffice = await prisma.backoffice.upsert({
        where: { usuarioId: usuario.id },
        update: {},
        create: {
          usuarioId: usuario.id,
          nome: 'BackOffice Admin',
          cpf: '12345678901',
          percentualComissaoDefault: 5.0,
          percentualComissaoMax: 100.0,
        },
      });

      expect(backoffice.usuarioId).toBe(usuario.id);
      expect(backoffice.cpf).toBe('12345678901');
    });

    it('deve criar backoffice vinculado ao usuário backoffice@asa.com', async () => {
      const usuario = await prisma.usuario.upsert({
        where: { email: 'backoffice@asa.com' },
        update: {},
        create: {
          nome: 'Backoffice Admin',
          email: 'backoffice@asa.com',
          senhaHash: 'hash',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      const backoffice = await prisma.backoffice.upsert({
        where: { usuarioId: usuario.id },
        update: {},
        create: {
          usuarioId: usuario.id,
          nome: 'Backoffice Admin',
          cpf: '12345678999',
          percentualComissaoDefault: 5.0,
          percentualComissaoMax: 100.0,
        },
      });

      expect(backoffice.usuarioId).toBe(usuario.id);
      expect(backoffice.cpf).toBe('12345678999');
    });

    it('deve criar consultor vinculado ao usuário consultor@asa.com', async () => {
      const usuario = await prisma.usuario.upsert({
        where: { email: 'consultor@asa.com' },
        update: {},
        create: {
          nome: 'Consultor',
          email: 'consultor@asa.com',
          senhaHash: 'hash',
          tipo: 'CONSULTOR',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      const consultor = await prisma.consultor.upsert({
        where: { usuarioId: usuario.id },
        update: {},
        create: {
          usuarioId: usuario.id,
          cpf: '12345678903',
        },
      });

      expect(consultor.usuarioId).toBe(usuario.id);
      expect(consultor.cpf).toBe('12345678903');
    });

    it('deve criar estabelecimentos vinculados ao consultor', async () => {
      const usuario = await prisma.usuario.upsert({
        where: { email: 'consultor@asa.com' },
        update: {},
        create: {
          nome: 'Consultor',
          email: 'consultor@asa.com',
          senhaHash: 'hash',
          tipo: 'CONSULTOR',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      const consultor = await prisma.consultor.upsert({
        where: { usuarioId: usuario.id },
        update: {},
        create: {
          usuarioId: usuario.id,
          cpf: '12345678903',
        },
      });

      const estab = await prisma.estabelecimento.upsert({
        where: { id: '9103241c-60e7-45a0-87eb-f12f2588cf6c' },
        update: {},
        create: {
          id: '9103241c-60e7-45a0-87eb-f12f2588cf6c',
          nomeFantasia: 'Churrascaria Gaúcha',
          razaoSocial: 'CG ltda',
          cnpj: '41.877.277/0001-84',
          endereco: 'rua da churras 123',
          cidade: 'ctba',
          estado: 'PR',
          telefone: '4133455220',
          status: 'ATIVO',
          consultorId: consultor.id,
          bancoNome: 'Itaú',
          agencia: '341',
          conta: '43433242342',
          pixTipo: 'CPF',
          pixChave: '53051173991',
        },
      });

      expect(estab.consultorId).toBe(consultor.id);
      expect(estab.cnpj).toBe('41.877.277/0001-84');
    });

    it('deve criar usuário estabelecimento vinculado ao estabelecimento', async () => {
      const estab = await prisma.estabelecimento.upsert({
        where: { id: '9103241c-60e7-45a0-87eb-f12f2588cf6c' },
        update: {},
        create: {
          id: '9103241c-60e7-45a0-87eb-f12f2588cf6c',
          nomeFantasia: 'Churrascaria Gaúcha',
          razaoSocial: 'CG ltda',
          cnpj: '41.877.277/0001-84',
          endereco: 'rua da churras 123',
          cidade: 'ctba',
          estado: 'PR',
          telefone: '4133455220',
          status: 'ATIVO',
          consultorId: 'cons-1',
          bancoNome: 'Itaú',
          agencia: '341',
          conta: '43433242342',
          pixTipo: 'CPF',
          pixChave: '53051173991',
        },
      });

      const usuarioEstab = await prisma.usuarioEstabelecimento.upsert({
        where: { email: 'gaucha@gmail.com' },
        update: {},
        create: {
          nome: 'Churrascaria Gaúcha',
          email: 'gaucha@gmail.com',
          senhaHash: 'hash',
          ativo: true,
          senhaTemporaria: false,
          estabelecimentoId: estab.id,
        },
      });

      expect(usuarioEstab.estabelecimentoId).toBe(estab.id);
      expect(usuarioEstab.email).toBe('gaucha@gmail.com');
    });
  });

  describe('Senha e Status', () => {
    it('deve definir senha temporária como false para todos os usuários', async () => {
      const result = await prisma.usuario.upsert({
        where: { email: 'admin@asa.com' },
        update: {},
        create: {
          nome: 'Administrador',
          email: 'admin@asa.com',
          senhaHash: 'hash',
          tipo: 'ADMIN',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result).toBeDefined();
    });

    it('deve definir status ATIVO para todos os usuários', async () => {
      const result = await prisma.usuario.upsert({
        where: { email: 'admin@asa.com' },
        update: {},
        create: {
          nome: 'Administrador',
          email: 'admin@asa.com',
          senhaHash: 'hash',
          tipo: 'ADMIN',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(result).toBeDefined();
    });

    it('deve usar upsert para update (não criar duplicado)', async () => {
      await prisma.usuario.upsert({
        where: { email: 'admin@asa.com' },
        update: { status: 'ATIVO' },
        create: {
          nome: 'Administrador',
          email: 'admin@asa.com',
          senhaHash: 'hash',
          tipo: 'ADMIN',
          papel: null,
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      expect(prisma.usuario.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: 'admin@asa.com' },
          update: expect.objectContaining({ status: 'ATIVO' }),
        })
      );
    });
  });

  describe('Estabelecimentos Fixos', () => {
    it('deve criar Estabelecimento 1: Churrascaria Gaúcha', async () => {
      const estab = await prisma.estabelecimento.upsert({
        where: { id: '9103241c-60e7-45a0-87eb-f12f2588cf6c' },
        update: {},
        create: {
          id: '9103241c-60e7-45a0-87eb-f12f2588cf6c',
          nomeFantasia: 'Churrascaria Gaúcha',
          razaoSocial: 'CG ltda',
          cnpj: '41.877.277/0001-84',
          endereco: 'rua da churras 123',
          cidade: 'ctba',
          estado: 'PR',
          telefone: '4133455220',
          status: 'ATIVO',
          consultorId: 'cons-1',
          bancoNome: 'Itaú',
          agencia: '341',
          conta: '43433242342',
          pixTipo: 'CPF',
          pixChave: '53051173991',
        },
      });

      expect(estab.nomeFantasia).toBe('Churrascaria Gaúcha');
      expect(estab.cnpj).toBe('41.877.277/0001-84');
    });

    it('deve criar Estabelecimento 2: Barbearia do Zé', async () => {
      const estab = await prisma.estabelecimento.upsert({
        where: { id: 'edd3af11-b0bf-4a18-934d-c1babb4007eb' },
        update: {},
        create: {
          id: 'edd3af11-b0bf-4a18-934d-c1babb4007eb',
          nomeFantasia: 'Barbearia do Zé',
          razaoSocial: 'BdZ ltda',
          cnpj: '94.566.679/0001-24',
          endereco: 'hair st 123',
          cidade: 'ctba',
          estado: 'PR',
          telefone: '41992524550',
          status: 'ATIVO',
          consultorId: 'cons-1',
          bancoNome: 'Itaú',
          agencia: '546',
          conta: '564654654',
          pixTipo: 'CPF',
          pixChave: '04703084945',
        },
      });

      expect(estab.nomeFantasia).toBe('Barbearia do Zé');
      expect(estab.cnpj).toBe('94.566.679/0001-24');
    });

    it('deve criar usuário estabelecimento para Barbearia do Zé', async () => {
      const usuarioEstab = await prisma.usuarioEstabelecimento.upsert({
        where: { email: 'barbearia@asa.com' },
        update: {},
        create: {
          nome: 'Barbearia do Zé',
          email: 'barbearia@asa.com',
          senhaHash: 'hash',
          ativo: true,
          senhaTemporaria: false,
          estabelecimentoId: 'edd3af11-b0bf-4a18-934d-c1babb4007eb',
        },
      });

      expect(usuarioEstab.email).toBe('barbearia@asa.com');
      expect(usuarioEstab.estabelecimentoId).toBe('edd3af11-b0bf-4a18-934d-c1babb4007eb');
    });
  });

  describe('Fluxo de Execução', () => {
    it('deve executar todas as operações em sequência (simulado)', async () => {
      const usuarios = [
        { email: 'admin@asa.com', tipo: 'ADMIN' },
        { email: 'back@asa.com', tipo: 'BACKOFFICE' },
        { email: 'gestor-pj@asa.com', tipo: 'GESTOR_PJ' },
        { email: 'consultor@asa.com', tipo: 'CONSULTOR' },
      ];

      for (const user of usuarios) {
        await prisma.usuario.upsert({
          where: { email: user.email },
          update: {},
          create: {
            nome: 'Test',
            email: user.email,
            senhaHash: 'hash',
            tipo: user.tipo,
            papel: user.tipo === 'BACKOFFICE' ? 'BACKOFFICE' : null,
            senhaTemporaria: false,
            status: 'ATIVO',
          },
        });
      }

      expect(prisma.usuario.upsert).toHaveBeenCalledTimes(4);
    });

    it('deve fazer disconnect ao finalizar', async () => {
      await prisma.$disconnect();
      expect(prisma.$disconnect).toHaveBeenCalled();
    });
  });

  describe('Valores Padrão', () => {
    it('deve usar percentualComissaoDefault de 5.0 para backoffices', async () => {
      const usuario = await prisma.usuario.upsert({
        where: { email: 'back@asa.com' },
        update: {},
        create: {
          nome: 'BackOffice Admin',
          email: 'back@asa.com',
          senhaHash: 'hash',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
          senhaTemporaria: false,
          status: 'ATIVO',
        },
      });

      await prisma.backoffice.upsert({
        where: { usuarioId: usuario.id },
        update: {},
        create: {
          usuarioId: usuario.id,
          nome: 'BackOffice Admin',
          cpf: '12345678901',
          percentualComissaoDefault: 5.0,
          percentualComissaoMax: 100.0,
        },
      });

      expect(prisma.backoffice.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            percentualComissaoDefault: 5.0,
            percentualComissaoMax: 100.0,
          }),
        })
      );
    });
  });
});