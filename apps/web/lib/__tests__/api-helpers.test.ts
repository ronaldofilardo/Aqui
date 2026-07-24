/**
 * Testes da Lib api-helpers
 * Valida funções de utilidade de resposta e autenticação
 */

import { describe, it, expect, vi } from 'vitest';
import { 
  ok, 
  badRequest, 
  notFound, 
  forbidden, 
  unauthorized,
  created 
} from '@/lib/api-helpers';
import { NextResponse } from 'next/server';

describe('api-helpers', () => {
  describe('Respostas JSON', () => {
    it('ok() deve retornar status 200', () => {
      const res = ok({ success: true });
      expect(res.status).toBe(200);
      expect(res.json()).resolves.toEqual({ success: true });
    });

    it('badRequest() deve retornar status 400', () => {
      const res = badRequest('Erro de requisição');
      expect(res.status).toBe(400);
      expect(res.json()).resolves.toEqual({ error: 'Erro de requisição' });
    });

    it('notFound() deve retornar status 404', () => {
      const res = notFound('Não encontrado');
      expect(res.status).toBe(404);
      expect(res.json()).resolves.toEqual({ error: 'Não encontrado' });
    });

    it('forbidden() deve retornar status 403', () => {
      const res = forbidden();
      expect(res.status).toBe(403);
      expect(res.json()).resolves.toEqual({ error: 'Acesso negado' });
    });

    it('unauthorized() deve retornar status 401', () => {
      const res = unauthorized();
      expect(res.status).toBe(401);
      expect(res.json()).resolves.toEqual({ error: 'Não autorizado' });
    });

    it('created() deve retornar status 201', () => {
      const res = created({ id: '1' });
      expect(res.status).toBe(201);
      expect(res.json()).resolves.toEqual({ id: '1' });
    });
  });

  describe('Auth Helpers (Mocks)', () => {
    // Para testar requireAuth, requireAdmin, etc., precisamos mockar auth()
    // Como auth() é importado de @/lib/auth, usamos vi.mock
  });
});