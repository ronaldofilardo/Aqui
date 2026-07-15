/**
 * Testes de Seed de Usuários - Validação de Dados Padrão
 * 
 * Valida que os usuários seed no banco de dados estão configurados corretamente
 * para os novos papéis de BACKOFFICE (antigo GESTOR_PF).
 */

import { describe, it, expect } from 'vitest';
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
    it('deve conter usuário back@asa.com com tipo GESTOR e papel BACKOFFICE', () => {
      expect(seedContent).toContain('back@asa.com');
      expect(seedContent).toContain("'GESTOR'");
      expect(seedContent).toContain("'BACKOFFICE'");
      
      const backofficeMatch = seedContent.match(
        /back@asa\.com'[\s\S]*?'GESTOR'[\s\S]*?'BACKOFFICE'/
      );
      expect(backofficeMatch).toBeTruthy();
    });

    it('deve conter backoffice na tabela backoffices com CPF 12345678901', () => {
      expect(seedContent).toContain('12345678901');
      expect(seedContent).toMatch(/INSERT INTO backoffices[\s\S]*?12345678901/);
    });
  });

  describe('Gestor PJ', () => {
    it('deve conter usuário gestor-pj@asa.com com tipo GESTOR e papel GESTOR_PJ', () => {
      expect(seedContent).toContain('gestor-pj@asa.com');
      expect(seedContent).toContain("'GESTOR_PJ'");
      
      const gestorPjMatch = seedContent.match(
        /gestor-pj@asa\.com'[\s\S]*?'GESTOR'[\s\S]*?'GESTOR_PJ'/
      );
      expect(gestorPjMatch).toBeTruthy();
    });

    it('deve conter gestor pj na tabela backoffices com CPF 12345678902', () => {
      expect(seedContent).toContain('12345678902');
      expect(seedContent).toMatch(/INSERT INTO backoffices[\s\S]*?12345678902/);
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
      expect(hashCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Matriz de Papéis', () => {
    const matriz = [
      { email: 'admin@asa.com', tipo: 'ADMIN', papel: null },
      { email: 'back@asa.com', tipo: 'GESTOR', papel: 'BACKOFFICE' },
      { email: 'gestor-pj@asa.com', tipo: 'GESTOR', papel: 'GESTOR_PJ' },
      { email: 'consultor@asa.com', tipo: 'CONSULTOR', papel: null },
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
});