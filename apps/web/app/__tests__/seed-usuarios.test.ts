/**
 * Testes de Seed de Usuários - Validação de Dados Padrão
 *
 * Valida que o seed_usuarios_default.sql contém os 3 perfis:
 * - admin (ADMIN)
 * - backoffice (BACKOFFICE / BACKOFFICE)
 * - consultor (CONSULTOR)
 *
 * gestor-pj é uma arquitetura independente (Consultor -> Estabelecimentos),
 * preservada em outro fluxo e fora deste seed.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Seed de Usuários - Validação', () => {
  const seedPath = path.join(
    process.cwd(),
    '..',
    '..',
    'packages',
    'database',
    'sql',
    'seed_usuarios_default.sql'
  );

  let seedContent: string;

  beforeAll(() => {
    const rootDir = process.cwd();
    const possiblePaths = [
      path.join(rootDir, 'packages', 'database', 'sql', 'seed_usuarios_default.sql'),
      path.join(rootDir, '..', 'packages', 'database', 'sql', 'seed_usuarios_default.sql'),
      path.join(rootDir, '..', '..', 'packages', 'database', 'sql', 'seed_usuarios_default.sql'),
    ];

    for (const p of possiblePaths) {
      try {
        seedContent = fs.readFileSync(p, 'utf-8');
        return;
      } catch (e) {
        continue;
      }
    }

    throw new Error('seed_usuarios_default.sql not found');
  });

  describe('Admin', () => {
    it('deve conter usuário admin@asa.com com tipo ADMIN', () => {
      expect(seedContent).toContain('admin@asa.com');
      expect(seedContent).toContain("'ADMIN'");
      expect(seedContent).toMatch(/admin@asa\.com'[\s\S]*?\$2a\$12\$uF0dL8sTPbckvCzvlvgK0uDoK3dm\/wEufvO0Xfn1MNiI4T\.6Nknni/);
    });
  });

  describe('BackOffice', () => {
    it('deve conter usuário back@asa.com com tipo BACKOFFICE', () => {
      expect(seedContent).toContain('back@asa.com');
      expect(seedContent).toContain("'BACKOFFICE'");

      const backofficeMatch = seedContent.match(
        /back@asa\.com'[\s\S]*?'BACKOFFICE'[\s\S]*?'BACKOFFICE'/
      );
      expect(backofficeMatch).toBeTruthy();
    });

    it('deve conter backoffice na tabela backoffices com CPF 12345678901', () => {
      expect(seedContent).toContain('12345678901');
      expect(seedContent).toMatch(/INSERT INTO backoffices[\s\S]*?12345678901/);
    });
  });

  describe('Consultor', () => {
    it('deve conter usuário consultor@asa.com com tipo CONSULTOR', () => {
      expect(seedContent).toContain('consultor@asa.com');
      expect(seedContent).toContain("'CONSULTOR'");
    });

    it('deve conter consultor na tabela consultores com CPF 12345678903', () => {
      expect(seedContent).toContain('12345678903');
      expect(seedContent).toMatch(/INSERT INTO consultores[\s\S]*?12345678903/);
    });
  });

  describe('Senha Padrão', () => {
    it('deve usar hash de senha padrão para todos os usuários', () => {
      const hashPadrao = '$2a$12$uF0dL8sTPbckvCzvlvgK0uDoK3dm/wEufvO0Xfn1MNiI4T.6Nknni';
      const hashCount = (seedContent.match(new RegExp(hashPadrao.replace(/\$/g, '\\$'), 'g')) || []).length;
      expect(hashCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Matriz de Papéis (3 perfis canônicos)', () => {
    const matriz = [
      { email: 'admin@asa.com', tipo: 'ADMIN', papel: null as string | null },
      { email: 'back@asa.com', tipo: 'BACKOFFICE', papel: 'BACKOFFICE' },
      { email: 'consultor@asa.com', tipo: 'CONSULTOR', papel: null as string | null },
    ];

    matriz.forEach(({ email, tipo, papel }) => {
      it(`deve configurar ${email} corretamente`, () => {
        expect(seedContent).toContain(email);

        const userSection = seedContent.match(
          new RegExp(`${email}'[\\s\\S]{0,500}`)
        );

        expect(userSection).toBeTruthy();

        if (userSection) {
          expect(userSection[0]).toContain(tipo);
          if (papel) {
            expect(userSection[0]).toContain(papel);
          }
        }
      });
    });
  });

  describe('Gestor PJ (fora deste seed)', () => {
    it('nao deve inserir gestor-pj@asa.com (arquitetura independente)', () => {
      // Remove comentários antes de buscar
      const sqlSemComentarios = seedContent.replace(/--[\s\S]*/g, '');
      const insertMatch = sqlSemComentarios.match(
        /INSERT INTO usuarios[\s\S]*?gestor-pj@asa\.com/
      );
      expect(insertMatch).toBeNull();
    });
  });
});
