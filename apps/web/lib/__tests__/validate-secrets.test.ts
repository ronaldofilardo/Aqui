/**
 * Testes da Lib validate-secrets
 * Valida o guard de inicialização contra segredos fracos/placeholder em produção.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateSecrets } from '@/lib/validate-secrets';

type EnvSnapshot = Record<string, string | undefined>;

function snapshotEnv(): EnvSnapshot {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXT_PHASE: process.env.NEXT_PHASE,
  };
}

function restoreEnv(snap: EnvSnapshot): void {
  for (const [key, value] of Object.entries(snap)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function setProdEnv(overrides: Partial<EnvSnapshot> = {}): void {
  process.env.NODE_ENV = 'production';
  delete process.env.NEXT_PHASE;
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('validateSecrets', () => {
  let snap: EnvSnapshot;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    snap = snapshotEnv();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv(snap);
    warnSpy.mockRestore();
    logSpy.mockRestore();
  });

  describe('fora de produção', () => {
    it('retorna silenciosamente quando NODE_ENV não é "production"', () => {
      process.env.NODE_ENV = 'test';
      process.env.NEXTAUTH_SECRET = 'qualquer-coisa';
      process.env.AUTH_SECRET = 'qualquer-coisa';

      expect(() => validateSecrets()).not.toThrow();
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe('em produção (runtime)', () => {
    it('lança quando NEXTAUTH_SECRET é undefined', () => {
      setProdEnv({
        NEXTAUTH_SECRET: undefined,
        AUTH_SECRET: 'algum-seguro-32-bytes-em-base64==',
      });

      expect(() => validateSecrets()).toThrow(/NEXTAUTH_SECRET is not set/);
    });

    it('lança quando AUTH_SECRET é undefined', () => {
      setProdEnv({
        NEXTAUTH_SECRET: 'algum-seguro-32-bytes-em-base64==',
        AUTH_SECRET: undefined,
      });

      expect(() => validateSecrets()).toThrow(/AUTH_SECRET is not set/);
    });

    it.each([
      ['change-me-in-production'],
      ['asa-test-secret'],
      ['test-secret-for-vitest-only'],
      ['MUST_GENERATE_NEW_SECRET_WITH_OPENSSL_IN_PRODUCTION'],
      ['aqui-dev-secret-change-in-prod'],
      ['dev-secret-replace-in-production'],
    ])('lança quando NEXTAUTH_SECRET é o placeholder fraco "%s"', (weak) => {
      setProdEnv({
        NEXTAUTH_SECRET: weak,
        AUTH_SECRET: 'algum-seguro-32-bytes-em-base64==',
      });

      expect(() => validateSecrets()).toThrow(/NEXTAUTH_SECRET has a weak value/);
    });

    it.each([
      ['change-me-in-production'],
      ['asa-test-secret'],
      ['test-secret-for-vitest-only'],
      ['MUST_GENERATE_NEW_SECRET_WITH_OPENSSL_IN_PRODUCTION'],
      ['aqui-dev-secret-change-in-prod'],
      ['dev-secret-replace-in-production'],
    ])('lança quando AUTH_SECRET é o placeholder fraco "%s"', (weak) => {
      setProdEnv({
        NEXTAUTH_SECRET: 'algum-seguro-32-bytes-em-base64==',
        AUTH_SECRET: weak,
      });

      expect(() => validateSecrets()).toThrow(/AUTH_SECRET has a weak value/);
    });

    it('emite warning (sem throw) quando NEXTAUTH_SECRET e AUTH_SECRET divergem', () => {
      setProdEnv({
        NEXTAUTH_SECRET: 'seguro-A-32-bytes-em-base64==',
        AUTH_SECRET: 'seguro-B-32-bytes-em-base64==',
      });

      expect(() => validateSecrets()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('NEXTAUTH_SECRET and AUTH_SECRET do not match'),
      );
    });

    it('não lança quando ambos os secrets são fortes e idênticos', () => {
      const strong = 'seguro-real-32-bytes-em-base64-==';
      setProdEnv({
        NEXTAUTH_SECRET: strong,
        AUTH_SECRET: strong,
      });

      expect(() => validateSecrets()).not.toThrow();
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security validation passed'),
      );
    });
  });

  describe('em produção (build phase)', () => {
    it('não lança quando NEXTAUTH_SECRET é undefined durante phase-production-build', () => {
      setProdEnv({
        NEXT_PHASE: 'phase-production-build',
        NEXTAUTH_SECRET: undefined,
        AUTH_SECRET: undefined,
      });

      expect(() => validateSecrets()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('skipped at build phase'),
      );
    });

    it('não lança quando o secret é fraco durante phase-production-build', () => {
      setProdEnv({
        NEXT_PHASE: 'phase-production-build',
        NEXTAUTH_SECRET: 'asa-test-secret',
        AUTH_SECRET: 'algum-seguro-32-bytes-em-base64==',
      });

      expect(() => validateSecrets()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('skipped at build phase'),
      );
    });

    it('não executa o log de "passed" durante build phase sem ambos os secrets', () => {
      setProdEnv({
        NEXT_PHASE: 'phase-production-build',
        NEXTAUTH_SECRET: undefined,
        AUTH_SECRET: undefined,
      });

      validateSecrets();
      expect(logSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Security validation passed'),
      );
    });
  });
});
