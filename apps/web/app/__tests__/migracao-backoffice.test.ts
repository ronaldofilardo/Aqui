/**
 * Testes de Integração - Migração BACKOFFICE
 * 
 * Valida todas as alterações após a migração de gestor-pf para backoffice
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@asa/database';

describe('Migração BACKOFFICE - Validação do Banco de Dados', () => {
  beforeAll(async () => {
    // Garantir que o banco está migrado
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Tabelas Renomeadas', () => {
    it('deve existir tabela backoffices', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'backoffices'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });

    it('NÃO deve existir tabela gestores_pf', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'gestores_pf'
        ) as exists
      `;
      expect(result[0].exists).toBe(false);
    });

    it('deve existir tabela uploads_planilha_backoffice', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_name = 'uploads_planilha_backoffice'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });
  });

  describe('2. Colunas Foreign Key', () => {
    it('deve existir backoffice_id em liderancas', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'liderancas' AND column_name = 'backoffice_id'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });

    it('deve existir backoffice_id em configuracoes_pontos', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'configuracoes_pontos' AND column_name = 'backoffice_id'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });

    it('deve existir backoffice_id em ciclos_pontos', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'ciclos_pontos' AND column_name = 'backoffice_id'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });

    it('deve existir backoffice_id em premios', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'premios' AND column_name = 'backoffice_id'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });

    it('deve existir backoffice_id em regras_comerciais', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'regras_comerciais' AND column_name = 'backoffice_id'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });

    it('deve existir backoffice_id em regras_gestores', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'regras_gestores' AND column_name = 'backoffice_id'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });
  });

  describe('3. Enums Atualizados', () => {
    it('deve existir BACKOFFICE no enum TipoUsuario', async () => {
      const result = await prisma.$queryRaw<{ value: string }[]>`
        SELECT unnest(enum_range(NULL::"TipoUsuario")) as value
      `;
      const values = result.map(r => r.value);
      expect(values).toContain('BACKOFFICE');
    });

    it('deve existir BACKOFFICE no enum PapelGestor', async () => {
      const result = await prisma.$queryRaw<{ value: string }[]>`
        SELECT unnest(enum_range(NULL::"PapelGestor")) as value
      `;
      const values = result.map(r => r.value);
      expect(values).toContain('BACKOFFICE');
    });
  });

  describe('4. Foreign Keys', () => {
    it('deve existir FK liderancas_backoffice_id_fkey', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'liderancas_backoffice_id_fkey'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });

    it('deve existir FK configuracoes_pontos_backoffice_id_fkey', async () => {
      const result = await prisma.$queryRaw<{ exists: boolean }>`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'configuracoes_pontos_backoffice_id_fkey'
        ) as exists
      `;
      expect(result[0].exists).toBe(true);
    });
  });
});

describe('Migração BACKOFFICE - Validação do Prisma Client', () => {
  it('deve criar backoffice via Prisma', async () => {
    const usuario = await prisma.usuario.create({
      data: {
        nome: 'Test Backoffice',
        email: `test-backoffice-${Date.now()}@asa.com`,
        senhaHash: 'hash-teste',
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
        backoffice: {
          create: {
            nome: 'Test Backoffice',
            cpf: '12345678901',
            percentualComissaoDefault: 5.0,
            percentualComissaoMax: 100.0,
          },
        },
      },
      include: {
        backoffice: true,
      },
    });

    expect(usuario.backoffice).toBeDefined();
    expect(usuario.backoffice?.cpf).toBe('12345678901');

    // Cleanup
    await prisma.backoffice.delete({ where: { usuarioId: usuario.id } });
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });

it('deve buscar backoffice com include', async () => {
    const usuario = await prisma.usuario.create({
      data: {
        nome: 'Test Backoffice 2',
        email: `test-backoffice-2-${Date.now()}@asa.com`,
        senhaHash: 'hash-teste',
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
        backoffice: {
          create: {
            nome: 'Test Backoffice',
            cpf: '12345678902',
          },
        },
      },
    });

    const backoffice = await prisma.backoffice.findUnique({
      where: { usuarioId: usuario.id },
      include: {
        usuario: true,
        liderancas: true,
        configuracoesPontos: true,
        ciclosPontos: true,
        premios: true,
      },
    });

    expect(backoffice).toBeDefined();
    expect(backoffice?.usuario).toBeDefined();
    expect(backoffice?.cpf).toBe('12345678902');

    // Cleanup
    await prisma.backoffice.delete({ where: { usuarioId: usuario.id } });
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });

it('deve criar ciclo de pontos vinculado ao backoffice', async () => {
    const usuario = await prisma.usuario.create({
      data: {
        nome: 'Test Backoffice 3',
        email: `test-backoffice-3-${Date.now()}@asa.com`,
        senhaHash: 'hash-teste',
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
        backoffice: {
          create: {
            nome: 'Test Backoffice',
            cpf: '12345678903',
          },
        },
      },
    });

    const ciclo = await prisma.cicloPontos.create({
      data: {
        backofficeId: usuario.backoffice!.id,
        nome: 'Ciclo Teste',
        inicioAcumuloEm: new Date(),
        fimAcumuloEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        fimResgateEm: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        status: 'EM_ANDAMENTO',
        periodicidade: 'ANUAL',
      },
    });

    expect(ciclo).toBeDefined();
    expect(ciclo.backofficeId).toBe(usuario.backoffice!.id);

    // Cleanup
    await prisma.cicloPontos.delete({ where: { id: ciclo.id } });
    await prisma.backoffice.delete({ where: { usuarioId: usuario.id } });
    await prisma.usuario.delete({ where: { id: usuario.id } });
  });
});

describe('Migração BACKOFFICE - Validação de Relacionamentos', () => {
it('deve criar backoffice com liderancas', async () => {
    const usuarioBackoffice = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Teste',
        email: `backoffice-lideranca-${Date.now()}@asa.com`,
        senhaHash: 'hash-teste',
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
        backoffice: {
          create: {
            nome: 'Test Backoffice',
            cpf: '12345678904',
          },
        },
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: usuarioBackoffice.id,
        nome: 'Lideranca Teste',
        cpf: '98765432100',
        backofficeId: usuarioBackoffice.backoffice!.id,
        tipo: 'COMERCIAL',
      },
    });

    expect(lideranca).toBeDefined();
    expect(lideranca.backofficeId).toBe(usuarioBackoffice.backoffice!.id);

    // Cleanup
    await prisma.lideranca.delete({ where: { id: lideranca.id } });
    await prisma.backoffice.delete({ where: { usuarioId: usuarioBackoffice.id } });
    await prisma.usuario.delete({ where: { id: usuarioBackoffice.id } });
  });

it('deve criar premio vinculado ao backoffice', async () => {
    const usuarioBackoffice = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Premio',
        email: `backoffice-premio-${Date.now()}@asa.com`,
        senhaHash: 'hash-teste',
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
        backoffice: {
          create: {
            nome: 'Test Backoffice',
            cpf: '12345678905',
          },
        },
      },
    });

    const premio = await prisma.premio.create({
      data: {
        backofficeId: usuarioBackoffice.backoffice!.id,
        nome: 'Prêmio Teste',
        descricao: 'Descrição do prêmio',
        custoPontos: 1000,
        ativo: true,
      },
    });

    expect(premio).toBeDefined();
    expect(premio.backofficeId).toBe(usuarioBackoffice.backoffice!.id);

    // Cleanup
    await prisma.premio.delete({ where: { id: premio.id } });
    await prisma.backoffice.delete({ where: { usuarioId: usuarioBackoffice.id } });
    await prisma.usuario.delete({ where: { id: usuarioBackoffice.id } });
  });
});
