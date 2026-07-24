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

  it('deve permitir acesso a rotas publicas', async () => {
    const req = createRequest('/login');
    const res = await middleware(req);
    expect(res).toBeNull();
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

    expect(res).toBeNull();
  });

  it('deve permitir CONSULTOR em /consultor/estabelecimentos', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'CONSULTOR',
      papel: null,
    });
    const req = createRequest('/consultor/estabelecimentos');
    const res = await middleware(req);

    expect(res).toBeNull();
  });

  it('deve permitir ESTABELECIMENTO em /estabelecimento/dashboard', async () => {
    (getToken as any).mockResolvedValue({
      tipo: 'ESTABELECIMENTO',
      papel: null,
    });
    const req = createRequest('/estabelecimento/dashboard');
    const res = await middleware(req);

    expect(res).toBeNull();
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
});
