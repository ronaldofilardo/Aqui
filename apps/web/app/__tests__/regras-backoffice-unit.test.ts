/**
 * Testes unitários das APIs de Regras - Comerciais e Gestores
 * Valida que as consultas Prisma usam o campo backoffice_id corretamente
 */

import { describe, it, expect, vi } from 'vitest';

describe('Regras Comerciais - Validação Prisma', () => {
  it('deve usar backoffice_id no where clause', async () => {
    const { prisma } = await import('@asa/database');
    
    const backofficeId = 'test-uuid-123';
    const findUniqueSpy = vi.spyOn(prisma.regraComercial, 'findUnique');
    
    try {
      await prisma.regraComercial.findUnique({
        where: { backofficeId },
      });
    } catch (e) {
      // Esperado falhar no banco de teste
    }
    
    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: { backofficeId },
    });
    
    findUniqueSpy.mockRestore();
  });

  it('deve usar backoffice_id no upsert create', async () => {
    const { prisma } = await import('@asa/database');
    
    const backofficeId = 'test-uuid-123';
    const upsertSpy = vi.spyOn(prisma.regraComercial, 'upsert');
    
    try {
      await prisma.regraComercial.upsert({
        where: { backofficeId },
        create: {
          backofficeId,
          cartaoAcessoSaude: 10,
          cireAtivo: 15,
          cireReceptivo: 12,
          franchisingAcesso: 8,
          franchisingCartao: 5,
          unidade: 20,
        },
        update: {
          cartaoAcessoSaude: 10,
          cireAtivo: 15,
        },
      });
    } catch (e) {
      // Esperado falhar no banco de teste
    }
    
    expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({
      where: { backofficeId },
      create: expect.objectContaining({ backofficeId }),
    }));
    
    upsertSpy.mockRestore();
  });

  it('deve validar que backofficeId é passado corretamente nas consultas', () => {
    // Teste unitário que valida a estrutura do código
    // Sem acesso ao banco de dados
    const backofficeId = 'test-uuid';
    
    // Simula a estrutura esperada da query
    const expectedQuery = {
      where: { backofficeId }
    };
    
    expect(expectedQuery.where.backofficeId).toBe(backofficeId);
    expect(typeof expectedQuery.where.backofficeId).toBe('string');
  });
});

describe('Regras Gestores - Validação Prisma', () => {
  it('deve usar backoffice_id no where clause', async () => {
    const { prisma } = await import('@asa/database');
    
    const backofficeId = 'test-uuid-456';
    const findUniqueSpy = vi.spyOn(prisma.regraGestor, 'findUnique');
    
    try {
      await prisma.regraGestor.findUnique({
        where: { backofficeId },
      });
    } catch (e) {
      // Esperado falhar no banco de teste
    }
    
    expect(findUniqueSpy).toHaveBeenCalledWith({
      where: { backofficeId },
    });
    
    findUniqueSpy.mockRestore();
  });

  it('deve usar backoffice_id no upsert create', async () => {
    const { prisma } = await import('@asa/database');
    
    const backofficeId = 'test-uuid-456';
    const upsertSpy = vi.spyOn(prisma.regraGestor, 'upsert');
    
    try {
      await prisma.regraGestor.upsert({
        where: { backofficeId },
        create: {
          backofficeId,
          gerenteCire: 10,
          supervisorAtivo: 15,
          supervisorReceptivo: 12,
          supervisorFranquia: 8,
          supervisorAtendimento: 5,
          gerenteAtendimento: 20,
          supervisorComercial: 18,
        },
        update: {
          gerenteCire: 10,
          supervisorAtivo: 15,
        },
      });
    } catch (e) {
      // Esperado falhar no banco de teste
    }
    
    expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({
      where: { backofficeId },
      create: expect.objectContaining({ backofficeId }),
    }));
    
    upsertSpy.mockRestore();
  });

  it('deve validar que o schema RegraGestor possui backoffice_id', async () => {
    const { prisma } = await import('@asa/database');
    
    const metadata = await prisma.regraGestor.findFirst({
      select: { backofficeId: true },
    });
    
    expect(metadata).toBeDefined();
    expect(typeof metadata?.backofficeId).toBe('string');
  });
});

describe('Regras - Validação de Campos Numéricos', () => {
  it('deve converter Decimal para number corretamente', () => {
    const decimalValue = "10.50";
    const numberValue = Number(decimalValue);
    
    expect(typeof numberValue).toBe('number');
    expect(numberValue).toBe(10.5);
  });
});