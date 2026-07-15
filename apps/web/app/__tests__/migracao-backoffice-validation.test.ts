/**
 * Testes de Migração - Gestor PF para Backoffice
 * Valida migração SQL e rollback
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@asa/database';

const execAsync = promisify(exec);

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || '5432',
  database: process.env.DB_NAME || 'asa_db_test',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const MIGRATION_FILE = 'packages/database/sql/migrate_gestor_pf_to_backoffice.sql';
const ROLLBACK_FILE = 'packages/database/sql/rollback_migrate_gestor_pf_to_backoffice.sql';

describe('Migração Backoffice - Testes de Validação', () => {
  let migrationExecuted = false;

  beforeAll(async () => {
    // Verificar se arquivo de migração existe
    try {
      await execAsync(`test -f ${MIGRATION_FILE}`);
    } catch (error) {
      throw new Error(`Arquivo de migração não encontrado: ${MIGRATION_FILE}`);
    }
  }, 30000);

  afterAll(async () => {
    // Rollback se migração foi executada nos testes
    if (migrationExecuted) {
      try {
        await execAsync(
          `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -f ${ROLLBACK_FILE}`
        );
        console.log('✅ Rollback executado com sucesso');
      } catch (error) {
        console.error('⚠️ Erro no rollback:', error);
      }
    }
  }, 30000);

  describe('Pré-Migração', () => {
    it('deve validar estrutura atual do banco (gestores_pf existe)', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gestores_pf'
        ) as exists`
      );

      expect(result[0].exists).toBe(true);
    }, 10000);

    it('deve validar tabela uploads_planilha_pf existe', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'uploads_planilha_pf'
        ) as exists`
      );

      expect(result[0].exists).toBe(true);
    }, 10000);

    it('deve validar coluna gestor_pf_id em liderancas', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'liderancas' AND column_name = 'gestor_pf_id'
        ) as exists`
      );

      expect(result[0].exists).toBe(true);
    }, 10000);

    it('deve validar enum BACKOFFICE existe', async () => {
      const result = await prisma.$queryRawUnsafe<{ tipo: string }>(
        `SELECT unnest(enum_range(NULL::"TipoUsuario")) as tipo`
      );

      const tipos = result.map(r => r.tipo);
      expect(tipos).toContain('BACKOFFICE');
    }, 10000);

    it('deve validar enum GESTOR_PJ existe', async () => {
      const result = await prisma.$queryRawUnsafe<{ tipo: string }>(
        `SELECT unnest(enum_range(NULL::"TipoUsuario")) as tipo`
      );

      const tipos = result.map(r => r.tipo);
      expect(tipos).toContain('GESTOR_PJ');
    }, 10000);
  });

  describe('Execução da Migração', () => {
    it('deve executar migração com sucesso', async () => {
      try {
        const { stdout, stderr } = await execAsync(
          `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -f ${MIGRATION_FILE}`
        );

        expect(stderr).toBe('');
        expect(stdout).toContain('ALTER TABLE');
        migrationExecuted = true;
      } catch (error: any) {
        console.error('Erro na migração:', error.stderr || error.message);
        throw error;
      }
    }, 30000);
  });

  describe('Pós-Migração - Validação', () => {
    it('deve validar tabela backoffices existe', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'backoffices'
        ) as exists`
      );

      expect(result[0].exists).toBe(true);
    }, 10000);

    it('deve validar tabela gestores_pf NÃO existe mais', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gestores_pf'
        ) as exists`
      );

      expect(result[0].exists).toBe(false);
    }, 10000);

    it('deve validar tabela uploads_planilha_backoffice existe', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'uploads_planilha_backoffice'
        ) as exists`
      );

      expect(result[0].exists).toBe(true);
    }, 10000);

    it('deve validar coluna backoffice_id em liderancas', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'liderancas' AND column_name = 'backoffice_id'
        ) as exists`
      );

      expect(result[0].exists).toBe(true);
    }, 10000);

    it('deve validar coluna gestor_pf_id NÃO existe mais em liderancas', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'liderancas' AND column_name = 'gestor_pf_id'
        ) as exists`
      );

      expect(result[0].exists).toBe(false);
    }, 10000);

    it('deve validar enum BACKOFFICE existe', async () => {
      const result = await prisma.$queryRawUnsafe<{ tipo: string }>(
        `SELECT unnest(enum_range(NULL::"TipoUsuario")) as tipo`
      );

      const tipos = result.map(r => r.tipo);
      expect(tipos).toContain('BACKOFFICE');
    }, 10000);

    it('deve validar enum GESTOR_PF NÃO existe mais', async () => {
      const result = await prisma.$queryRawUnsafe<{ tipo: string }>(
        `SELECT unnest(enum_range(NULL::"TipoUsuario")) as tipo`
      );

      const tipos = result.map(r => r.tipo);
      expect(tipos).not.toContain('GESTOR_PF');
    }, 10000);

    it('deve validar índices renomeados', async () => {
      const result = await prisma.$queryRawUnsafe<{ indexname: string }>(
        `SELECT indexname FROM pg_indexes 
         WHERE tablename = 'backoffices' AND indexname LIKE '%usuario_id%'`
      );

      expect(result.some(r => r.indexname === 'backoffices_usuario_id_key')).toBe(true);
    }, 10000);

    it('deve validar foreign keys atualizadas', async () => {
      const result = await prisma.$queryRawUnsafe<{ constraint_name: string }>(
        `SELECT tc.constraint_name 
         FROM information_schema.table_constraints AS tc 
         WHERE tc.table_name = 'liderancas' 
         AND tc.constraint_type = 'FOREIGN KEY'
         AND tc.constraint_name LIKE '%backoffice%'`
      );

      expect(result.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Validação de Dados', () => {
    it('deve validar dados migrados em backoffices', async () => {
      const backoffice = await prisma.backoffice.findFirst();
      
      expect(backoffice).toBeDefined();
      expect(backoffice?.id).toBeDefined();
      expect(backoffice?.nome).toBeDefined();
      expect(backoffice?.cpf).toBeDefined();
    }, 10000);

    it('deve validar relacionamentos migrados (liderancas)', async () => {
      const lideranca = await prisma.lideranca.findFirst({
        include: { backoffice: true },
      });

      expect(lideranca).toBeDefined();
      expect(lideranca?.backoffice).toBeDefined();
      expect(lideranca?.backofficeId).toBeDefined();
    }, 10000);

    it('deve validar uploads migrados', async () => {
      const upload = await prisma.uploadPlanilhaBackoffice.findFirst({
        include: { backoffice: true },
      });

      expect(upload).toBeDefined();
      expect(upload?.backoffice).toBeDefined();
    }, 10000);

    it('deve validar integridade referencial', async () => {
      // Tentar criar backoffice e deletar em cascata
      const usuario = await prisma.usuario.create({
        data: {
          nome: 'Teste Migração',
          email: `teste-migracao-${Date.now()}@asa.com`,
          senhaHash: 'hash-teste',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
        },
      });

      const backoffice = await prisma.backoffice.create({
        data: {
          usuarioId: usuario.id,
          nome: 'Teste Migração',
          cpf: '12345678999',
        },
      });

      const lideranca = await prisma.lideranca.create({
        data: {
          usuarioId: usuario.id,
          nome: 'Teste Migração',
          cpf: '98765432199',
          backofficeId: backoffice.id,
          tipo: 'COMERCIAL',
        },
      });

      expect(lideranca.backofficeId).toBe(backoffice.id);

      // Deletar backoffice deve fazer cascade em liderancas
      await prisma.backoffice.delete({ where: { id: backoffice.id } });
      await prisma.usuario.delete({ where: { id: usuario.id } });

      const liderancaDeletada = await prisma.lideranca.findUnique({
        where: { id: lideranca.id },
      });

      expect(liderancaDeletada).toBeNull();
    }, 10000);
  });

  describe('Rollback', () => {
    it('deve executar rollback com sucesso', async () => {
      try {
        const { stdout, stderr } = await execAsync(
          `psql -h ${DB_CONFIG.host} -p ${DB_CONFIG.port} -U ${DB_CONFIG.user} -d ${DB_CONFIG.database} -f ${ROLLBACK_FILE}`
        );

        expect(stderr).toBe('');
        migrationExecuted = false; // Rollback executado
      } catch (error: any) {
        console.error('Erro no rollback:', error.stderr || error.message);
        throw error;
      }
    }, 30000);

    it('deve validar rollback (gestores_pf restaurado)', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'gestores_pf'
        ) as exists`
      );

      expect(result[0].exists).toBe(true);
    }, 10000);

    it('deve validar rollback (backoffices não existe mais)', async () => {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'backoffices'
        ) as exists`
      );

      expect(result[0].exists).toBe(false);
    }, 10000);
  });
});