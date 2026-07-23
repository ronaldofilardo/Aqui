/**
 * Testes da API de Comissões de Comercial
 * Valida listagem de comissões por comercial
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API - Backoffice Comerciais [id] Comissões', () => {
  const BASE_URL = 'http://localhost:3000/api/v1/backoffice/comerciais';
  const comercialId = 'comercial-teste-123';

  describe('GET /api/v1/backoffice/comerciais/[id]/comissoes', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-invalido' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      const response = await fetch(`${BASE_URL}/comercial-inexistente/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice', async () => {
      const response = await fetch(`${BASE_URL}/comercial-outro-backoffice/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-1' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar lista de comissões do comercial', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve retornar comissões com estrutura correta', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        const comissao = data[0];
        expect(comissao).toHaveProperty('id');
        expect(comissao).toHaveProperty('comercialId');
        expect(comissao).toHaveProperty('mesReferencia');
        expect(comissao).toHaveProperty('valorComissao');
        expect(comissao).toHaveProperty('status');
      }
    });

    it('deve ordenar comissões por mês de referência (mais recente primeiro)', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 1) {
        const dates = data.map((c: any) => c.mesReferencia);
        const sorted = [...dates].sort((a, b) => b.localeCompare(a));
        expect(dates).toEqual(sorted);
      }
    });

    it('deve limitar a 24 comissões', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.length).toBeLessThanOrEqual(24);
    });

    it('deve retornar array vazio quando comercial não tem comissões', async () => {
      const response = await fetch(`${BASE_URL}/comercial-sem-comissoes/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });

    it('deve permitir acesso a comercial sem liderança', async () => {
      const response = await fetch(`${BASE_URL}/comercial-sem-lideranca/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Verificação de Comissões Existentes', () => {
    it('deve retornar true quando comercial tem comissões', async () => {
      const response = await fetch(`${BASE_URL}/comercial-com-comissoes/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.length).toBeGreaterThan(0);
    });

    it('deve retornar false quando comercial não tem comissões', async () => {
      const response = await fetch(`${BASE_URL}/comercial-sem-comissoes/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.length).toBe(0);
    });

    it('deve incluir comissões de todos os meses disponíveis', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Deve retornar até 24 meses
      expect(data.length).toBeLessThanOrEqual(24);
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Estrutura de Dados da Comissão', () => {
    it('deve incluir ID da comissão', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        expect(data[0].id).toBeDefined();
        expect(typeof data[0].id).toBe('string');
      }
    });

    it('deve incluir mês de referência no formato YYYY-MM', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        expect(data[0].mesReferencia).toMatch(/^\d{4}-\d{2}$/);
      }
    });

    it('deve incluir valor da comissão como número', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        expect(typeof data[0].valorComissao).toBe('number');
        expect(data[0].valorComissao).toBeGreaterThanOrEqual(0);
      }
    });

    it('deve incluir status da comissão', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        expect(['PENDENTE', 'PAGA', 'CANCELADA']).toContain(data[0].status);
      }
    });
  });

  describe('Permissões por Backoffice', () => {
    it('deve permitir acesso apenas ao backoffice dono do comercial', async () => {
      const responseBackoffice1 = await fetch(`${BASE_URL}/comercial-backoffice-1/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-1' },
      });
      
      expect(responseBackoffice1.status).toBe(200);
      
      const responseBackoffice2 = await fetch(`${BASE_URL}/comercial-backoffice-1/comissoes`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-2' },
      });
      
      expect(responseBackoffice2.status).toBe(403);
    });
  });
});