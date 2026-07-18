/**
 * Testes para verificar as correções aplicadas:
 *  - Enum TipoUsuario contém GESTOR_PJ
 *  - Seed SQL existe e é executável
 *  - Usuários padrão estão ATIVOS no banco
 *  - Hash bcrypt de '123456' é válido para todos os usuários padrão
 */

import { describe, it, expect } from 'vitest';
import { prisma } from '@asa/database';
import { compare } from 'bcryptjs';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// process.cwd() é C:\apps\ASA\apps\web quando se roda vitest a partir daí
const PROJECT_ROOT = process.cwd();
const SEED_FILE = resolve(PROJECT_ROOT, '../../packages/database/sql/seed_usuarios_padrao.sql');
const SCHEMA_FILE = resolve(PROJECT_ROOT, '../../packages/database/prisma/schema.prisma');

describe('Enum TipoUsuario', () => {
  it('deve conter o valor GESTOR_PJ', async () => {
    const values: Array<{ unnest: string }> = await prisma.$queryRawUnsafe(
      `SELECT unnest(enum_range(NULL::"TipoUsuario")) AS unnest`
    );
    const labels = values.map((v) => v.unnest);
    expect(labels).toContain('GESTOR_PJ');
  });

  it('deve preservar valores originais', async () => {
    const values: Array<{ unnest: string }> = await prisma.$queryRawUnsafe(
      `SELECT unnest(enum_range(NULL::"TipoUsuario")) AS unnest`
    );
    const labels = values.map((v) => v.unnest);
    expect(labels).toEqual(
      expect.arrayContaining([
        'ADMIN',
        'BACKOFFICE',
        'SUPERVISAO',
        'GERENCIA',
        'CONSULTOR',
        'PARCEIRO',
        'COMERCIAL',
        'LIDERANCA',
        'GESTOR_PJ',
      ])
    );
  });
});

describe('Schema Prisma - tipo GESTOR_PJ', () => {
  it('deve estar definido no arquivo schema.prisma', () => {
    const content = readFileSync(SCHEMA_FILE, 'utf-8');

    const enumMatch = content.match(/enum TipoUsuario \{([\s\S]*?)\}/);
    expect(enumMatch).not.toBeNull();

    const enumBody = enumMatch![1];
    expect(enumBody).toContain('GESTOR_PJ');
  });
});

describe('Arquivo de seed SQL', () => {
  it('deve existir em packages/database/sql/seed_usuarios_padrao.sql', () => {
    expect(existsSync(SEED_FILE)).toBe(true);
  });

  it('deve conter INSERT para admin, back, gestor-pj e consultor', () => {
    const content = readFileSync(SEED_FILE, 'utf-8');
    expect(content).toContain("'admin@asa.com'");
    expect(content).toContain("'back@asa.com'");
    expect(content).toContain("'gestor-pj@asa.com'");
    expect(content).toContain("'consultor@asa.com'");
  });

  it('deve usar status ATIVO e senha_temporaria false', () => {
    const content = readFileSync(SEED_FILE, 'utf-8');
    expect(content).toContain("'ATIVO'");
    expect(content).toContain('false');
  });

  it('deve atribuir tipo e papel GESTOR_PJ para gestor-pj', () => {
    const content = readFileSync(SEED_FILE, 'utf-8');
    expect(content).toContain("'gestor-pj@asa.com'");
    expect(content).toMatch(/'GESTOR_PJ',\s*'GESTOR_PJ'/);
  });

  it('deve ser idempotente (usar ON CONFLICT DO UPDATE)', () => {
    const content = readFileSync(SEED_FILE, 'utf-8');
    expect(content).toContain('ON CONFLICT');
  });
});

describe('Banco de dados - usuários padrão Ativos', () => {
  const usuariosEsperados = [
    { email: 'admin@asa.com', tipo: 'ADMIN' },
    { email: 'back@asa.com', tipo: 'BACKOFFICE', papel: 'BACKOFFICE' },
    { email: 'gestor-pj@asa.com', tipo: 'GESTOR_PJ', papel: 'GESTOR_PJ' },
    { email: 'consultor@asa.com', tipo: 'CONSULTOR' },
  ];

  for (const u of usuariosEsperados) {
    it(`${u.email} deve existir com tipo=${u.tipo}, papel=${u.papel ?? 'NULL'}, status=ATIVO`, async () => {
      const user = await prisma.usuario.findUnique({
        where: { email: u.email },
        select: { tipo: true, papel: true, status: true, senhaHash: true },
      });
      expect(user).not.toBeNull();
      expect(user!.tipo).toBe(u.tipo);
      expect(user!.papel).toBe(u.papel ?? null);
      expect(user!.status).toBe('ATIVO');
    });

    it(`${u.email} deve ter senhaHash válido para "123456"`, async () => {
      const user = await prisma.usuario.findUnique({
        where: { email: u.email },
        select: { senhaHash: true },
      });
      expect(user).not.toBeNull();
      const ok = await compare('123456', user!.senhaHash);
      expect(ok).toBe(true);
    });
  }
});

describe('Registros relacionados dos usuários padrão', () => {
  it('back@asa.com deve ter um registro em backoffices com cpf 12345678901', async () => {
    const back = await prisma.backoffice.findFirst({
      where: { cpf: '12345678901' },
      select: { nome: true, percentualComissaoDefault: true, usuario: { select: { email: true } } },
    });
    expect(back).not.toBeNull();
    expect(back!.usuario.email).toBe('back@asa.com');
  });

  it('consultor@asa.com deve ter um registro em consultores com cpf 12345678903', async () => {
    const cons = await prisma.consultor.findFirst({
      where: { cpf: '12345678903' },
      select: { usuario: { select: { email: true } } },
    });
    expect(cons).not.toBeNull();
    expect(cons!.usuario.email).toBe('consultor@asa.com');
  });
});

describe('Idempotência do seed (re-execução)', () => {
  it('deve poder ser executado duas vezes sem erro', async () => {
    const cmd = `psql -U postgres -h localhost -d asa_db -f "${SEED_FILE}" 2>&1`;
    const env = { ...process.env, PGPASSWORD: '123456' };

    const { stderr } = await execAsync(cmd, {
      env,
      shell: 'C:\\Windows\\System32\\cmd.exe',
    });
    if (stderr && !/WARNING|NOTICE|já existe/.test(stderr)) {
      throw new Error(`Seed stderr: ${stderr}`);
    }

    const count = await prisma.usuario.count({
      where: {
        email: {
          in: ['admin@asa.com', 'back@asa.com', 'gestor-pj@asa.com', 'consultor@asa.com'],
        },
      },
    });
    expect(count).toBe(4);
  }, 60000);
});
