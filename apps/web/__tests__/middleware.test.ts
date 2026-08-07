/**
 * Testes de Integracao do Middleware (AQUI - PJ)
 * Valida redirecionamentos e permissoes de rotas
 */

import { describe, it, expect, vi } from 'vitest';
import { middleware } from '@/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

describe('Middleware de Autenticacao e Papeis (AQUI)', () => {
  const createRequest = (url: string) => {
    return new NextRequest(new URL(url, 'http://localhost:3000'));
  };

  const expectPasses = (res: any) => {
    expect(res).toBeInstanceOf(NextResponse);
    expect(res.headers.get('x-middleware-next')).toBe('1');
  };

  it('deve permitir acesso a rotas publicas', async () => {
    const req = createRequest('/login');
    const res = await middleware(req);
    expectPasses(res);
  });

  it('deve redirecionar para /login se tentar acessar rota protegida sem token', async () => {
    (getToken as any).mockResolvedValue(null);
    const req = createRequest('/admin/usuarios');
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('deve redirecionar GESTOR_PJ para dashboard de gestor', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'GESTOR_PJ',
      papel: 'GESTOR_PJ',
    });
    const req = createRequest('/gestor/dashboard');
    const res = await middleware(req);

    expectPasses(res);
  });

  it('deve permitir CONSULTOR em /consultor/estabelecimentos', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'CONSULTOR',
      papel: null,
    });
    const req = createRequest('/consultor/estabelecimentos');
    const res = await middleware(req);

    expectPasses(res);
  });

  it('deve permitir ESTABELECIMENTO em /estabelecimento/dashboard', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'ESTABELECIMENTO',
      papel: null,
    });
    const req = createRequest('/estabelecimento/dashboard');
    const res = await middleware(req);

    expectPasses(res);
  });

  it('deve forcar HTTPS em producao', async () => {
    const original = process.env.NODE_ENV;
    vi.stubEnv('NODE_ENV', 'production');
    const req = createRequest('http://localhost:3000/dashboard');
    const res = await middleware(req);

    expect(res).toBeInstanceOf(NextResponse);
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toContain('https://');

    vi.stubEnv('NODE_ENV', original ?? 'development');
    vi.unstubAllEnvs();
  });

  /**
   * Correcao: getToken deve usar AUTH_SECRET (Auth.js v5) com fallback
   * para NEXTAUTH_SECRET. Sem isso, o middleware redireciona o usuario
   * de volta para /login em loop na Vercel + dominio custom.
   */
  describe('getToken secret resolution', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('deve usar AUTH_SECRET quando definido (Auth.js v5)', async () => {
      vi.stubEnv('AUTH_SECRET', 'auth-secret-from-vercel');
      vi.stubEnv('NEXTAUTH_SECRET', 'nextauth-secret-fallback');

      (getToken as any).mockResolvedValue({ tipo: 'ADMIN', papel: null });
      const req = createRequest('/admin/usuarios');
      await middleware(req);

      expect(getToken).toHaveBeenCalledWith(
        expect.objectContaining({ secret: 'auth-secret-from-vercel' }),
      );
    });

    it('deve usar NEXTAUTH_SECRET como fallback quando AUTH_SECRET nao definido', async () => {
      delete process.env.AUTH_SECRET;
      process.env.NEXTAUTH_SECRET = 'nextauth-secret-fallback';

      (getToken as any).mockResolvedValue({ tipo: 'ADMIN', papel: null });
      const req = createRequest('/admin/usuarios');
      await middleware(req);

      expect(getToken).toHaveBeenCalledWith(
        expect.objectContaining({ secret: 'nextauth-secret-fallback' }),
      );
    });

    it('NÃO deve passar secret undefined para getToken', async () => {
      delete process.env.AUTH_SECRET;
      process.env.NEXTAUTH_SECRET = 'fallback-when-auth-missing';

      (getToken as any).mockResolvedValue(null);
      const req = createRequest('/admin/usuarios');
      await middleware(req);

      const calls = (getToken as any).mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      const lastCall = calls[calls.length - 1][0];
      expect(lastCall.secret).not.toBeUndefined();
    });
  });
});
