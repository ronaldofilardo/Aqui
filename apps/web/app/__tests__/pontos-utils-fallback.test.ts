/**
 * Testes Unitários - Fallback de Configuração de Pontos
 * Valida que calcularPontosDeProducao usa fallback quando não há config
 * exata para a data de referência, e lança erro quando não há config alguma.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { calcularPontosDeProducao } from '@/lib/pontos-utils';
import { Decimal } from '@prisma/client/runtime/library';

describe('Pontos Utils - Fallback de Configuração', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;

  beforeEach(async () => {
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Fallback Test',
        email: `backoffice-fallback-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: 'Backoffice Fallback Test',
        cpf: `${Date.now()}00000000000`.slice(0, 11),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;
  });

  afterEach(async () => {
    await prisma.backoffice.deleteMany({ where: { usuario: { email: { endsWith: "@asa.test" } } } }).catch(() => {});
    await prisma.usuario.deleteMany({ where: { email: { endsWith: "@asa.test" } } }).catch(() => {});
  });

  describe('Fallback quando não há config para a data exata', () => {
    it('deve usar a configuração mais recente quando produção é anterior à vigência', async () => {
      // Config criada em 2026-03-01 — não cobre produções de 2026-01
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(100),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-03-01'),
        },
      });

      // Produção de 2026-01-15: não há config vigente naquela data
      // Fallback deve usar a config mais recente (100 por ponto)
      const pontos = await calcularPontosDeProducao(
        250,
        new Date('2026-01-15'),
        backofficeId,
      );

      expect(pontos).toBe(3); // 250/100 = 2.5 → 3 (arredondamento padrão)
    });

    it('deve usar a configuração mais recente quando produção é posterior à vigência', async () => {
      // Config com vigenteAte definido
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(50),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
          vigenteAte: new Date('2026-02-28'),
        },
      });

      // Produção de 2026-06-15: além do período de vigência
      // Fallback deve usar a config mais recente (50 por ponto)
      const pontos = await calcularPontosDeProducao(
        150,
        new Date('2026-06-15'),
        backofficeId,
      );

      expect(pontos).toBe(3); // 150/50 = 3
    });

    it('deve usar a config mais recente entre várias quando nenhuma cobre a data', async () => {
      // Config antiga
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(50),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
          vigenteAte: new Date('2026-02-28'),
        },
      });

      // Config mais recente (mas ainda não cobre 2026-06)
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(200),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-03-01'),
          vigenteAte: new Date('2026-05-31'),
        },
      });

      // Produção de 2026-06-15: nenhuma config cobre
      // Fallback usa a mais recente (200 por ponto)
      const pontos = await calcularPontosDeProducao(
        600,
        new Date('2026-06-15'),
        backofficeId,
      );

      expect(pontos).toBe(3); // 600/200 = 3
    });
  });

  describe('Quando não há configuração alguma', () => {
    it('deve lançar erro quando não existe nenhuma configuracaoPontos', async () => {
      await expect(
        calcularPontosDeProducao(
          150,
          new Date('2026-03-15'),
          backofficeId,
        ),
      ).rejects.toThrow('Configuração de pontos não encontrada');
    });
  });

  describe('Quando há config vigente para a data exata', () => {
    it('deve usar a config correta sem fallback', async () => {
      // Config antiga
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(50),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
          vigenteAte: new Date('2026-02-28'),
        },
      });

      // Config vigente para março
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(200),
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-03-01'),
        },
      });

      // Produção em março usa a config de março (200), não a mais recente
      const pontos = await calcularPontosDeProducao(
        300,
        new Date('2026-03-15'),
        backofficeId,
      );

      expect(pontos).toBe(2); // 300/200 = 1.5 → 2
    });
  });

  describe('Arredondamento com fallback', () => {
    beforeEach(async () => {
      // Única config, vigente a partir de 2026-06
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(100),
          tipoArredondamento: 'PISO',
          vigenteDesde: new Date('2026-06-01'),
        },
      });
    });

    it('deve aplicar PISO no fallback', async () => {
      // Produção anterior à vigência — fallback usa PISO
      const pontos = await calcularPontosDeProducao(
        150,
        new Date('2026-01-15'),
        backofficeId,
      );

      expect(pontos).toBe(1); // 150/100 = 1.5 → 1 (piso)
    });

    it('deve aplicar TETO no fallback', async () => {
      // Atualizar para TETO
      const config = await prisma.configuracaoPontos.findFirst({
        where: { backofficeId },
      });
      await prisma.configuracaoPontos.update({
        where: { id: config!.id },
        data: { tipoArredondamento: 'TETO' },
      });

      const pontos = await calcularPontosDeProducao(
        150,
        new Date('2026-01-15'),
        backofficeId,
      );

      expect(pontos).toBe(2); // 150/100 = 1.5 → 2 (teto)
    });
  });
});
