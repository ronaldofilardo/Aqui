/**
 * Testes Unitários - Rate Limiting
 * Valida implementação de rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  checkRateLimit, 
  getRateLimitOptions, 
  cleanupRateLimitStore,
  withRateLimit,
} from '@/lib/rate-limit';
import { NextRequest } from 'next/server';

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Limpar store antes de cada teste
    cleanupRateLimitStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupRateLimitStore();
  });

  describe('checkRateLimit', () => {
    it('deve permitir primeira requisição dentro do limite', () => {
      const result = checkRateLimit('user-123', { 
        limit: 10, 
        windowMs: 60 * 1000 
      });

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('deve bloquear após exceder limite', () => {
      const options: RateLimitOptions = { 
        limit: 3, 
        windowMs: 60 * 1000 
      };

      // Fazer 3 requisições
      checkRateLimit('user-456', options);
      checkRateLimit('user-456', options);
      checkRateLimit('user-456', options);

      // 4ª requisição deve ser bloqueada
      const result = checkRateLimit('user-456', options);
      
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBeGreaterThan(Date.now());
    });

    it('deve resetar contador após janela de tempo', async () => {
      const options: RateLimitOptions = { 
        limit: 2, 
        windowMs: 100 // 100ms para teste rápido
      };

      // Exceder limite
      checkRateLimit('user-789', options);
      checkRateLimit('user-789', options);
      let result = checkRateLimit('user-789', options);
      expect(result.success).toBe(false);

      // Aguardar janela expirar
      await new Promise(resolve => setTimeout(resolve, 150));

      // Nova requisição deve ser permitida
      result = checkRateLimit('user-789', options);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it('deve tratar identificadores diferentes separadamente', () => {
      const options: RateLimitOptions = { limit: 2, windowMs: 60 * 1000 };

      // User 1 excede limite
      checkRateLimit('user-A', options);
      checkRateLimit('user-A', options);
      const resultA = checkRateLimit('user-A', options);
      expect(resultA.success).toBe(false);

      // User 2 ainda deve ter limite disponível
      const resultB = checkRateLimit('user-B', options);
      expect(resultB.success).toBe(true);
      expect(resultB.remaining).toBe(1);
    });
  });

  describe('getRateLimitOptions', () => {
    it('deve retornar opções padrão para rotas não especificadas', () => {
      const options = getRateLimitOptions('/api/v1/backoffice/rota-desconhecida');
      
      expect(options.limit).toBe(100);
      expect(options.windowMs).toBe(60 * 1000);
    });

    it('deve retornar opções específicas para /pontos/distribuir', () => {
      const options = getRateLimitOptions('/api/v1/backoffice/pontos/distribuir');
      
      expect(options.limit).toBe(10);
      expect(options.windowMs).toBe(60 * 1000);
    });

    it('deve retornar opções específicas para /uploads', () => {
      const options = getRateLimitOptions('/api/v1/backoffice/uploads');
      
      expect(options.limit).toBe(5);
      expect(options.windowMs).toBe(60 * 1000);
    });

    it('deve retornar opções específicas para /pontos/ranking', () => {
      const options = getRateLimitOptions('/api/v1/backoffice/pontos/ranking');
      
      expect(options.limit).toBe(30);
      expect(options.windowMs).toBe(60 * 1000);
    });

    it('deve corresponder rotas com prefixo', () => {
      const options = getRateLimitOptions('/api/v1/backoffice/pontos/ranking/extra');
      
      expect(options.limit).toBe(30);
    });
  });

  describe('cleanupRateLimitStore', () => {
    it('deve remover entradas expiradas', async () => {
      // Criar entrada com janela curta
      checkRateLimit('user-cleanup', { limit: 5, windowMs: 50 });
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Cleanup deve remover entrada
      cleanupRateLimitStore();
      
      // Nova requisição deve começar do zero
      const result = checkRateLimit('user-cleanup', { limit: 5, windowMs: 50 });
      expect(result.remaining).toBe(4); // 5 - 1
    });

    it('deve manter entradas válidas', () => {
      // Criar entrada com janela longa
      checkRateLimit('user-keep', { limit: 5, windowMs: 60000 });
      
      // Cleanup não deve remover
      cleanupRateLimitStore();
      
      // Contador deve ser mantido
      const result = checkRateLimit('user-keep', { limit: 5, windowMs: 60000 });
      expect(result.remaining).toBe(3); // 5 - 2
    });
  });

  describe('withRateLimit', () => {
    it('deve permitir requisição dentro do limite', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '192.168.1.1']]),
        nextUrl: { pathname: '/api/v1/backoffice/pontos/ranking' },
      } as unknown as NextRequest;

      const result = withRateLimit(mockRequest, { limit: 10, windowMs: 60 * 1000 });
      
      expect(result.success).toBe(true);
      expect(result.response).toBeUndefined();
    });

    it('deve bloquear requisição excedendo limite', () => {
      const mockRequest = {
        headers: new Map([['x-forwarded-for', '10.0.0.1']]),
        nextUrl: { pathname: '/api/v1/backoffice/uploads' },
      } as unknown as NextRequest;

      // Exceder limite (5 req/min)
      for (let i = 0; i < 5; i++) {
        withRateLimit(mockRequest, { limit: 5, windowMs: 60 * 1000 });
      }

      const result = withRateLimit(mockRequest, { limit: 5, windowMs: 60 * 1000 });
      
      expect(result.success).toBe(false);
      expect(result.response).toBeDefined();
      expect(result.response!.status).toBe(429);
    });
  });
});