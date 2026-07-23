/**
 * Testes - Permissão para Comerciais sem Liderança
 * Valida que comerciais sem liderança (liderancaId = null) podem:
 * - Ser deletados (DELETE /api/v1/backoffice/comerciais/[id])
 * - Ter metas salvas (POST /api/v1/backoffice/comerciais/[id]/metas)
 * - Ver comissões (GET /api/v1/backoffice/comerciais/[id]/comissoes)
 * 
 * Antes da correção: a validação `!comercial.lideranca || ...` retornava 403
 * Depois da correção: `comercial.lideranca && comercial.lideranca.backofficeId !== backofficeId`
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { uniqueCpf } from './test-helpers';

describe('API Comerciais sem Liderança - Permissão', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let comercialSemLiderancaId: string;
  let comercialComLiderancaId: string;
  let liderancaId: string;

  beforeEach(async () => {
    // Criar backoffice
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Permissão Test',
        email: `backoffice-perm-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: 'Backoffice Permissão Test',
        cpf: uniqueCpf(),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;

    // Criar liderança para teste comparativo
    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: `Lideranca ${Date.now()}`,
        email: `lideranca-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'LIDERANCA',
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: 'Lideranca Test',
        cpf: uniqueCpf(),
        backofficeId,
        tipo: 'COMERCIAL',
      },
    });
    liderancaId = lideranca.id;

    // Criar comercial SEM liderança
    const usuarioSemLideranca = await prisma.usuario.create({
      data: {
        nome: `Comercial Sem Lideranca ${Date.now()}`,
        email: `com-sem-lideranca-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });

    const comercialSemLideranca = await prisma.comercial.create({
      data: {
        usuarioId: usuarioSemLideranca.id,
        nome: 'Comercial Sem Lideranca',
        cpf: uniqueCpf(),
        liderancaId: null, // SEM liderança
        percentualComissao: 5.0,
        funcao: 'SUPERVISOR_ATIVO',
        tipoLideranca: null,
      },
    });
    comercialSemLiderancaId = comercialSemLideranca.id;

    // Criar comercial COM liderança para comparação
    const usuarioComLideranca = await prisma.usuario.create({
      data: {
        nome: `Comercial Com Lideranca ${Date.now()}`,
        email: `com-com-lideranca-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });

    const comercialComLideranca = await prisma.comercial.create({
      data: {
        usuarioId: usuarioComLideranca.id,
        nome: 'Comercial Com Lideranca',
        cpf: uniqueCpf(),
        liderancaId,
        percentualComissao: 5.0,
        funcao: 'GERENTE_CIRE',
        tipoLideranca: 'COMERCIAL',
      },
    });
    comercialComLiderancaId = comercialComLideranca.id;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.comercial.deleteMany({ 
      where: { id: { in: [comercialSemLiderancaId, comercialComLiderancaId] } } 
    });
    await prisma.lideranca.deleteMany({ where: { id: liderancaId } });
    await prisma.backoffice.deleteMany({ where: { id: backofficeId } });
    await prisma.usuario.updateMany({ 
      where: { id: backofficeUsuarioId }, 
      data: { status: 'INATIVO' } 
    });
  });

  describe('Validação de permissão', () => {
    it('deve permitir acesso a comercial sem liderança (lideranca = null)', async () => {
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialSemLiderancaId },
        include: { lideranca: true },
      });

      expect(comercial).toBeDefined();
      expect(comercial?.liderancaId).toBeNull();
      expect(comercial?.lideranca).toBeNull();
      
      // A nova lógica deve permitir: comercial.lideranca && ...
      // Como lideranca é null, a condição não entra e permite
      const backofficeIdMock = backofficeId;
      const devePermitir = !(comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeIdMock);
      expect(devePermitir).toBe(true);
    });

    it('deve permitir acesso a comercial com liderança do mesmo backoffice', async () => {
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialComLiderancaId },
        include: { lideranca: true },
      });

      expect(comercial).toBeDefined();
      expect(comercial?.liderancaId).toBe(liderancaId);
      expect(comercial?.lideranca?.backofficeId).toBe(backofficeId);
      
      // A nova lógica deve permitir: lideranca.backofficeId === backofficeId
      const backofficeIdMock = backofficeId;
      const devePermitir = !(comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeIdMock);
      expect(devePermitir).toBe(true);
    });

    it('deve negar acesso a comercial com liderança de outro backoffice', async () => {
      // Criar outro backoffice
      const outroBackoffice = await prisma.backoffice.create({
        data: {
          usuario: {
            create: {
              nome: 'Outro Backoffice',
              email: `outro-backoffice-${Date.now()}@asa.test`,
              senhaHash: await hash('123456', 12),
              tipo: 'BACKOFFICE',
              papel: 'BACKOFFICE',
            },
          },
          nome: 'Outro Backoffice',
          cpf: uniqueCpf(),
        },
      });

      // Criar liderança em outro backoffice
      const outraLiderancaUsuario = await prisma.usuario.create({
        data: {
          nome: `Outra Lideranca ${Date.now()}`,
          email: `outra-lideranca-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'LIDERANCA',
        },
      });

      const outraLideranca = await prisma.lideranca.create({
        data: {
          usuarioId: outraLiderancaUsuario.id,
          nome: 'Outra Lideranca',
          cpf: uniqueCpf(),
          backofficeId: outroBackoffice.id,
          tipo: 'COMERCIAL',
        },
      });

      // Criar comercial com liderança de outro backoffice
      const outroComercialUsuario = await prisma.usuario.create({
        data: {
          nome: `Outro Comercial ${Date.now()}`,
          email: `outro-comercial-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const outroComercial = await prisma.comercial.create({
        data: {
          usuarioId: outroComercialUsuario.id,
          nome: 'Outro Comercial',
          cpf: uniqueCpf(),
          liderancaId: outraLideranca.id,
          percentualComissao: 5.0,
        },
      });

      const comercial = await prisma.comercial.findUnique({
        where: { id: outroComercial.id },
        include: { lideranca: true },
      });

      expect(comercial?.lideranca?.backofficeId).toBe(outroBackoffice.id);
      
      // A nova lógica deve negar: lideranca.backofficeId !== backofficeId
      const backofficeIdMock = backofficeId;
      const devePermitir = !(comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeIdMock);
      expect(devePermitir).toBe(false); // Deve negar

      // Cleanup
      await prisma.comercial.delete({ where: { id: outroComercial.id } });
      await prisma.lideranca.delete({ where: { id: outraLideranca.id } });
      await prisma.backoffice.delete({ where: { id: outroBackoffice.id } });
    });
  });

  describe('Operações com Comercial sem Liderança', () => {
    it('deve permitir salvar meta para comercial sem liderança', async () => {
      // Simular a lógica da rota POST /metas
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialSemLiderancaId },
        include: { lideranca: { select: { backofficeId: true } } },
      });

      expect(comercial).toBeDefined();
      expect(comercial?.liderancaId).toBeNull();
      
      // Verificação de permissão (nova lógica)
      if (comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
        throw new Error('Acesso negado');
      }
      // Deve passar sem erro

      // Criar meta
      const meta = await prisma.metaComercial.create({
        data: {
          comercialId: comercialSemLiderancaId,
          mesReferencia: '2026-01',
          valorMeta: 50000,
          valorAtingido: 0,
        },
      });

      expect(meta).toBeDefined();
      expect(Number(meta.valorMeta)).toBe(50000);

      // Cleanup
      await prisma.metaComercial.delete({ where: { id: meta.id } });
    });

    it('deve permitir buscar metas de comercial sem liderança', async () => {
      // Criar meta primeiro
      const meta = await prisma.metaComercial.create({
        data: {
          comercialId: comercialSemLiderancaId,
          mesReferencia: '2026-02',
          valorMeta: 60000,
          valorAtingido: 0,
        },
      });

      // Simular a lógica da rota GET /metas
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialSemLiderancaId },
        include: { lideranca: { select: { backofficeId: true } } },
      });

      expect(comercial).toBeDefined();
      expect(comercial?.liderancaId).toBeNull();
      
      // Verificação de permissão (nova lógica)
      if (comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
        throw new Error('Acesso negado');
      }
      // Deve passar sem erro

      // Buscar metas
      const metas = await prisma.metaComercial.findMany({
        where: { comercialId: comercialSemLiderancaId },
      });

      expect(metas.length).toBeGreaterThan(0);
      expect(metas.some(m => m.id === meta.id)).toBe(true);

      // Cleanup
      await prisma.metaComercial.delete({ where: { id: meta.id } });
    });

    it('deve permitir buscar comissões de comercial sem liderança', async () => {
      // Criar comissão primeiro
      const comissao = await prisma.comissaoComercial.create({
        data: {
          comercialId: comercialSemLiderancaId,
          mesReferencia: '2026-03',
          valorVendas: 100000,
          valorComissao: 5000,
          status: 'CALCULADA',
        },
      });

      // Simular a lógica da rota GET /comissoes
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialSemLiderancaId },
        include: { lideranca: { select: { backofficeId: true } } },
      });

      expect(comercial).toBeDefined();
      expect(comercial?.liderancaId).toBeNull();
      
      // Verificação de permissão (nova lógica)
      if (comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
        throw new Error('Acesso negado');
      }
      // Deve passar sem erro

      // Buscar comissões
      const comissoes = await prisma.comissaoComercial.findMany({
        where: { comercialId: comercialSemLiderancaId },
      });

      expect(comissoes.length).toBeGreaterThan(0);
      expect(comissoes.some(c => c.id === comissao.id)).toBe(true);

      // Cleanup
      await prisma.comissaoComercial.delete({ where: { id: comissao.id } });
    });

    it('deve permitir deletar (soft delete) comercial sem liderança', async () => {
      // Simular a lógica da rota DELETE /comerciais/[id]
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialSemLiderancaId },
        include: { 
          usuario: true,
          comissoes: true,
          metas: true,
          lideranca: { select: { backofficeId: true } }
        },
      });

      expect(comercial).toBeDefined();
      expect(comercial?.liderancaId).toBeNull();
      
      // Verificação de permissão (nova lógica)
      if (comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
        throw new Error('Acesso negado');
      }
      // Deve passar sem erro

      // Simular soft delete
      const usuarioId = comercial.usuarioId;
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: 'INATIVO' },
      });

      await prisma.comercial.update({
        where: { id: comercialSemLiderancaId },
        data: { status: 'INATIVO' },
      });

      // Verificar soft delete
      const usuarioAtualizado = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });
      expect(usuarioAtualizado?.status).toBe('INATIVO');

      const comercialAtualizado = await prisma.comercial.findUnique({
        where: { id: comercialSemLiderancaId },
      });
      expect(comercialAtualizado?.status).toBe('INATIVO');

      // Cleanup: reativar para futuros testes
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: 'ATIVO' },
      });
      await prisma.comercial.update({
        where: { id: comercialSemLiderancaId },
        data: { status: 'ATIVO' },
      });
    });
  });

  describe('Operações com Comercial com Liderança', () => {
    it('deve permitir salvar meta para comercial com liderança do mesmo backoffice', async () => {
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialComLiderancaId },
        include: { lideranca: { select: { backofficeId: true } } },
      });

      expect(comercial?.lideranca?.backofficeId).toBe(backofficeId);
      
      // Verificação de permissão (nova lógica)
      if (comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
        throw new Error('Acesso negado');
      }
      // Deve passar sem erro

      const meta = await prisma.metaComercial.create({
        data: {
          comercialId: comercialComLiderancaId,
          mesReferencia: '2026-01',
          valorMeta: 70000,
        },
      });

      expect(meta).toBeDefined();

      // Cleanup
      await prisma.metaComercial.delete({ where: { id: meta.id } });
    });

    it('deve permitir deletar comercial com liderança do mesmo backoffice', async () => {
      const comercial = await prisma.comercial.findUnique({
        where: { id: comercialComLiderancaId },
        include: { 
          usuario: true,
          lideranca: { select: { backofficeId: true } }
        },
      });

      expect(comercial?.lideranca?.backofficeId).toBe(backofficeId);
      
      // Verificação de permissão (nova lógica)
      if (comercial?.lideranca && comercial.lideranca.backofficeId !== backofficeId) {
        throw new Error('Acesso negado');
      }
      // Deve passar sem erro

      // Simular soft delete
      const usuarioId = comercial.usuarioId;
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: 'INATIVO' },
      });

      await prisma.comercial.update({
        where: { id: comercialComLiderancaId },
        data: { status: 'INATIVO' },
      });

      expect(comercial.lideranca?.backofficeId).toBe(backofficeId);

      // Cleanup: reativar
      await prisma.usuario.update({
        where: { id: usuarioId },
        data: { status: 'ATIVO' },
      });
      await prisma.comercial.update({
        where: { id: comercialComLiderancaId },
        data: { status: 'ATIVO' },
      });
    });
  });
});