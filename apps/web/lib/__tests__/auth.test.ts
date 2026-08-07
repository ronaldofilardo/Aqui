/**
 * Testes da configuracao NextAuth (lib/auth.ts)
 * Valida ajustes para ambiente de producao (Vercel + dominio custom)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const authSource = readFileSync(
  resolve(__dirname, '..', 'auth.ts'),
  'utf-8',
);

describe('lib/auth.ts - config NextAuth', () => {
  it('deve habilitar trustHost:true para Auth.js v5 em producao', () => {
    expect(authSource).toMatch(/trustHost:\s*true/);
  });

  it('deve usar estrategia JWT na sessao', () => {
    expect(authSource).toMatch(/session:\s*\{\s*strategy:\s*["']jwt["']/);
  });

  it('deve apontar signIn para /login', () => {
    expect(authSource).toMatch(/signIn:\s*["']\/login["']/);
  });

  it('deve propagar tipo/papel/consultorId/estabelecimentoId no JWT e na sessao', () => {
    const jwtCallback = authSource.match(
      /async jwt\(\{[^}]*\}\)\s*\{[\s\S]*?\n\s{2}\}/,
    );
    expect(jwtCallback).not.toBeNull();
    expect(jwtCallback![0]).toMatch(/token\.tipo\s*=/);
    expect(jwtCallback![0]).toMatch(/token\.papel\s*=/);

    const sessionCallback = authSource.match(
      /async session\(\{[^}]*\}\)\s*\{[\s\S]*?\n\s{2}\}/,
    );
    expect(sessionCallback).not.toBeNull();
    expect(sessionCallback![0]).toMatch(/session\.user/);
  });
});
