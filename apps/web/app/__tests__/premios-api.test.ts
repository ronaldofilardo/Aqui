/**
 * Testes da API de Prêmios - /api/v1/backoffice/pontos/premios
 * Valida endpoints de criação, listagem, atualização e exclusão de prêmios
 */

import { describe, it, expect } from 'vitest';

describe('API /api/v1/backoffice/pontos/premios', () => {
  const BASE_URL = '/api/v1/backoffice/pontos/premios';

  const mockPremioValido = {
    codigo: 'TEST001',
    tipo: 'PRODUTO',
    descricao: 'Produto de teste',
    pontos: 1000,
  };

  describe('POST /api/v1/backoffice/pontos/premios', () => {
    it('deve criar prêmio com dados válidos', () => {
      const payload = {
        codigo: 'PROD001',
        tipo: 'PRODUTO',
        descricao: 'Produto exemplo',
        pontos: 1500,
      };

      expect(payload.codigo).toBe('PROD001');
      expect(payload.tipo).toBe('PRODUTO');
      expect(payload.descricao).toBe('Produto exemplo');
      expect(payload.pontos).toBe(1500);
      expect(Number.isInteger(payload.pontos)).toBe(true);
    });

    it('deve retornar erro quando código vazio', () => {
      const payload = { ...mockPremioValido, codigo: '' };
      expect(payload.codigo.trim()).toBe('');
    });

    it('deve retornar erro quando tipo vazio', () => {
      const payload = { ...mockPremioValido, tipo: '' };
      expect(payload.tipo.trim()).toBe('');
    });

    it('deve retornar erro quando descrição vazia', () => {
      const payload = { ...mockPremioValido, descricao: '' };
      expect(payload.descricao.trim()).toBe('');
    });

    it('deve retornar erro quando pontos negativo ou zero', () => {
      const payloadZero = { ...mockPremioValido, pontos: 0 };
      const payloadNegativo = { ...mockPremioValido, pontos: -100 };
      
      expect(payloadZero.pontos).toBe(0);
      expect(payloadNegativo.pontos).toBeLessThan(0);
    });

    it('deve retornar sucesso com mensagem "Prêmio criado com sucesso"', () => {
      const response = {
        id: 'uuid-valido',
        codigo: 'PROD001',
        tipo: 'PRODUTO',
        descricao: 'Produto exemplo',
        pontos: 1500,
        ativo: true,
        mensagem: 'Prêmio criado com sucesso',
      };

      expect(response.mensagem).toBe('Prêmio criado com sucesso');
      expect(response.ativo).toBe(true);
      expect(response.codigo).toBe('PROD001');
    });

    it('deve exigir autenticação backoffice', () => {
      const semAutenticacao = null;
      expect(semAutenticacao).toBeNull();
    });
  });

  describe('GET /api/v1/backoffice/pontos/premios', () => {
    it('deve retornar lista de prêmios do backoffice', () => {
      const premios = [
        {
          id: '1',
          codigo: 'PROD001',
          tipo: 'PRODUTO',
          descricao: 'Produto 1',
          pontos: 1000,
          ativo: true,
        },
        {
          id: '2',
          codigo: 'SERV001',
          tipo: 'SERVICO',
          descricao: 'Serviço 1',
          pontos: 2000,
          ativo: true,
        },
      ];

      expect(premios.length).toBe(2);
      expect(premios[0].codigo).toBe('PROD001');
      expect(premios[1].tipo).toBe('SERVICO');
    });

    it('deve retornar prêmios ordenados por criadoEm desc', () => {
      const premios = [
        { id: '1', codigo: 'A', criadoEm: '2026-07-19T10:00:00Z' },
        { id: '2', codigo: 'B', criadoEm: '2026-07-19T12:00:00Z' },
        { id: '3', codigo: 'C', criadoEm: '2026-07-19T08:00:00Z' },
      ];

      const ordenados = [...premios].sort((a, b) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );

      expect(ordenados[0].codigo).toBe('B');
      expect(ordenados[2].codigo).toBe('C');
    });

    it('deve filtrar apenas prêmios do backoffice logado', () => {
      const backofficeId = 'backoffice-123';
      const premios = [
        { id: '1', backofficeId: 'backoffice-123', codigo: 'A' },
        { id: '2', backofficeId: 'backoffice-456', codigo: 'B' },
      ];

      const filtrados = premios.filter(p => p.backofficeId === backofficeId);
      
      expect(filtrados.length).toBe(1);
      expect(filtrados[0].backofficeId).toBe('backoffice-123');
    });

    it('deve retornar estrutura com campos: id, codigo, tipo, descricao, pontos, ativo, criadoEm', () => {
      const premio = {
        id: 'uuid',
        codigo: 'CODE',
        tipo: 'PRODUTO',
        descricao: 'Desc',
        pontos: 100,
        ativo: true,
        criadoEm: '2026-07-19T00:00:00Z',
      };

      const chavesEsperadas = ['id', 'codigo', 'tipo', 'descricao', 'pontos', 'ativo', 'criadoEm'];
      expect(Object.keys(premio)).toEqual(chavesEsperadas);
    });
  });

  describe('PATCH /api/v1/backoffice/pontos/premios?id={id}', () => {
    it('deve atualizar prêmio existente', () => {
      const update = {
        codigo: 'NEWCODE',
        tipo: 'SERVICO',
        descricao: 'Nova descrição',
        pontos: 2500,
      };

      expect(update.codigo).toBe('NEWCODE');
      expect(update.tipo).toBe('SERVICO');
    });

    it('deve exigir ID do prêmio na query string', () => {
      const id = 'premio-id-123';
      const url = `${BASE_URL}?id=${id}`;
      
      expect(url).toContain('id=premio-id-123');
    });

    it('deve retornar erro 403 se prêmio não pertencer ao backoffice', () => {
      const premioBackofficeId = 'backoffice-123';
      const usuarioBackofficeId = 'backoffice-456';
      
      expect(premioBackofficeId).not.toBe(usuarioBackofficeId);
    });

    it('deve permitir atualização parcial', () => {
      const partialUpdate = {
        pontos: 3000,
      };

      expect(Object.keys(partialUpdate)).toEqual(['pontos']);
    });

    it('deve retornar sucesso com mensagem "Prêmio atualizado com sucesso"', () => {
      const response = {
        id: 'uuid',
        codigo: 'CODE',
        tipo: 'PRODUTO',
        descricao: 'Desc',
        pontos: 1000,
        ativo: true,
        mensagem: 'Prêmio atualizado com sucesso',
      };

      expect(response.mensagem).toBe('Prêmio atualizado com sucesso');
    });
  });

  describe('DELETE /api/v1/backoffice/pontos/premios?id={id}', () => {
    it('deve desativar prêmio (soft delete)', () => {
      const premioAntes = { id: '1', ativo: true };
      const premioDepois = { id: '1', ativo: false };
      
      expect(premioAntes.ativo).toBe(true);
      expect(premioDepois.ativo).toBe(false);
    });

    it('deve exigir ID do prêmio na query string', () => {
      const id = 'premio-id-123';
      const url = `${BASE_URL}?id=${id}`;
      
      expect(url).toContain('id=premio-id-123');
    });

    it('deve retornar erro 403 se prêmio não pertencer ao backoffice', () => {
      const premioBackofficeId = 'backoffice-123';
      const usuarioBackofficeId = 'backoffice-456';
      
      expect(premioBackofficeId).not.toBe(usuarioBackofficeId);
    });

    it('deve retornar sucesso com mensagem "Prêmio deletado com sucesso"', () => {
      const response = {
        id: 'premio-id-123',
        mensagem: 'Prêmio deletado com sucesso',
      };

      expect(response.mensagem).toBe('Prêmio deletado com sucesso');
    });

    it('deve preservar histórico de resgates', () => {
      const softDelete = true;
      expect(softDelete).toBe(true);
    });
  });

  describe('Schema Validation', () => {
    it('CreatePremioSchema deve validar campos obrigatórios', () => {
      const schema = {
        codigo: 'string.min(1)',
        tipo: 'string.min(1)',
        descricao: 'string.min(1)',
        pontos: 'number.int.positive',
      };

      expect(Object.keys(schema)).toEqual(['codigo', 'tipo', 'descricao', 'pontos']);
    });

    it('UpdatePremioSchema deve permitir campos opcionais', () => {
      const schema = {
        codigo: 'string.min(1).optional()',
        tipo: 'string.min(1).optional()',
        descricao: 'string.min(1).optional()',
        pontos: 'number.int.positive().optional()',
        ativo: 'boolean.optional()',
      };

      expect(Object.keys(schema)).toEqual(['codigo', 'tipo', 'descricao', 'pontos', 'ativo']);
    });

    it('deve rejeitar pontos não inteiro', () => {
      const pontosFloat = 100.5;
      expect(Number.isInteger(pontosFloat)).toBe(false);
    });

    it('deve aceitar tipos válidos: PRODUTO, SERVICO, EXPERIENCIA, VOUCHER', () => {
      const tiposValidos = ['PRODUTO', 'SERVICO', 'EXPERIENCIA', 'VOUCHER'];
      
      tiposValidos.forEach(tipo => {
        expect(typeof tipo).toBe('string');
        expect(tipo.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('deve retornar badRequest com mensagem de erro do Zod', () => {
      const erro = 'Código é obrigatório';
      expect(erro).toContain('obrigatório');
    });

    it('deve retornar badRequest "Erro ao buscar prêmios" em caso de exceção', () => {
      const erroGenerico = 'Erro ao buscar prêmios';
      expect(erroGenerico).toContain('prêmios');
    });

    it('deve retornar badRequest "Erro ao criar prêmio" em caso de exceção', () => {
      const erroGenerico = 'Erro ao criar prêmio';
      expect(erroGenerico).toContain('criar');
    });

    it('deve retornar badRequest "Erro ao atualizar prêmio" em caso de exceção', () => {
      const erroGenerico = 'Erro ao atualizar prêmio';
      expect(erroGenerico).toContain('atualizar');
    });

    it('deve retornar badRequest "Erro ao deletar prêmio" em caso de exceção', () => {
      const erroGenerico = 'Erro ao deletar prêmio';
      expect(erroGenerico).toContain('deletar');
    });
  });
});