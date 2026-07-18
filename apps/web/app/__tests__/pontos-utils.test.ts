/**
 * Testes Unitários - Utils de Pontos
 * Valida cálculos de pontos, comissões e ciclos
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { 
  calcularPontosDeProducao, 
  obterCicloVigente,
  calcularComissaoComercial 
} from '@/lib/pontos-utils';
import { Decimal } from '@prisma/client/runtime/library';

let _cpfSeq = 0;
const uniqueCpf = () => {
  _cpfSeq++;
  return `${Date.now()}${_cpfSeq}${Math.floor(Math.random() * 1000)}`.slice(0, 11).padStart(11, "0");
};

describe('Pontos Utils - Testes Unitários', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;
  let comercialId: string;

  beforeEach(async () => {
    // Setup: Criar backoffice, liderança e comercial
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Teste Utils',
        email: `backoffice-utils-${Date.now()}@asa.com`,
        senhaHash: await hash('123456', 12),
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: 'Backoffice Utils Test',
        cpf: uniqueCpf(),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: 'Lideranca Utils Test',
        email: `lideranca-utils-${Date.now()}@asa.com`,
        senhaHash: await hash('123456', 12),
        tipo: 'LIDERANCA',
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: 'Lideranca Utils',
        cpf: uniqueCpf(),
        backofficeId,
        tipo: 'COMERCIAL',
      },
    });
    liderancaId = lideranca.id;

    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: 'Comercial Utils Test',
        email: `comercial-utils-${Date.now()}@asa.com`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        liderancaId,
        nome: 'Comercial Utils',
        cpf: uniqueCpf(),
        percentualComissao: 5.0,
        funcao: 'SUPERVISOR_ATIVO',
      },
    });
    comercialId = comercial.id;
  });

  afterEach(async () => {
    // Soft delete em massa - respeita RESTRICT constraints
    await prisma.usuario.updateMany({ data: { status: "INATIVO" } });
  });

  describe('calcularPontosDeProducao', () => {
    it('deve calcular pontos com configuração PADRAO', async () => {
      // Criar configuração de pontos
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(100), // R$ 100 = 1 ponto
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });

      const pontos = await calcularPontosDeProducao(
        150, // R$ 150,00
        new Date('2026-03-15'),
        backofficeId,
      );

      expect(pontos).toBe(2); // 150/100 = 1.5 → 2 (arredondamento padrão)
    });

    it('deve calcular pontos com configuração PISO', async () => {
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(100),
          tipoArredondamento: 'PISO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });

      const pontos = await calcularPontosDeProducao(
        150,
        new Date('2026-03-15'),
        backofficeId,
      );

      expect(pontos).toBe(1); // 150/100 = 1.5 → 1 (piso)
    });

    it('deve calcular pontos com configuração TETO', async () => {
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(100),
          tipoArredondamento: 'TETO',
          vigenteDesde: new Date('2026-01-01'),
        },
      });

      const pontos = await calcularPontosDeProducao(
        150,
        new Date('2026-03-15'),
        backofficeId,
      );

      expect(pontos).toBe(2); // 150/100 = 1.5 → 2 (teto)
    });

    it('deve lançar erro se não houver configuração', async () => {
      await expect(
        calcularPontosDeProducao(
          150,
          new Date('2026-03-15'),
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toThrow('Configuração de pontos não encontrada');
    });

    it('deve usar configuração vigente na data correta', async () => {
      // Criar configuração antiga
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(50), // R$ 50 = 1 ponto
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-01-01'),
          vigenteAte: new Date('2026-02-28'),
        },
      });

      // Criar configuração nova
      await prisma.configuracaoPontos.create({
        data: {
          backofficeId,
          valorPorPonto: new Decimal(200), // R$ 200 = 1 ponto
          tipoArredondamento: 'PADRAO',
          vigenteDesde: new Date('2026-03-01'),
        },
      });

      // Data em março usa configuração nova
      const pontosMarco = await calcularPontosDeProducao(
        200,
        new Date('2026-03-15'),
        backofficeId,
      );
      expect(pontosMarco).toBe(1); // 200/200 = 1

      // Data em fevereiro usa configuração antiga
      const pontosFevereiro = await calcularPontosDeProducao(
        100,
        new Date('2026-02-15'),
        backofficeId,
      );
      expect(pontosFevereiro).toBe(2); // 100/50 = 2
    });
  });

  describe('obterCicloVigente', () => {
    it('deve retornar ciclo EM_ANDAMENTO', async () => {
      await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Vigente Test',
          periodicidade: 'ANUAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-06-30'),
          fimResgateEm: new Date('2026-08-31'),
          status: 'EM_ANDAMENTO',
        },
      });

      const ciclo = await obterCicloVigente(backofficeId);

      expect(ciclo).toBeDefined();
      expect(ciclo?.nome).toBe('Ciclo Vigente Test');
      expect(ciclo?.status).toBe('EM_ANDAMENTO');
    });

    it('deve retornar ciclo RESGATE_ABERTO se não houver EM_ANDAMENTO', async () => {
      await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Resgate Test',
          periodicidade: 'ANUAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-06-30'),
          fimResgateEm: new Date('2026-08-31'),
          status: 'RESGATE_ABERTO',
        },
      });

      const ciclo = await obterCicloVigente(backofficeId);

      expect(ciclo).toBeDefined();
      expect(ciclo?.status).toBe('RESGATE_ABERTO');
    });

    it('deve retornar null se não houver ciclo vigente', async () => {
      const ciclo = await obterCicloVigente(backofficeId);

      expect(ciclo).toBeNull();
    });

    it('deve filtrar por periodicidade SEMESTRAL', async () => {
      await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Semestral',
          periodicidade: 'SEMESTRAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-06-30'),
          fimResgateEm: new Date('2026-08-31'),
          status: 'EM_ANDAMENTO',
        },
      });

      await prisma.cicloPontos.create({
        data: {
          backofficeId,
          nome: 'Ciclo Anual',
          periodicidade: 'ANUAL',
          inicioAcumuloEm: new Date('2026-01-01'),
          fimAcumuloEm: new Date('2026-12-31'),
          fimResgateEm: new Date('2027-02-28'),
          status: 'EM_ANDAMENTO',
        },
      });

      const cicloSemestral = await obterCicloVigente(backofficeId, 'SEMESTRAL');
      expect(cicloSemestral?.nome).toBe('Ciclo Semestral');

      const cicloAnual = await obterCicloVigente(backofficeId, 'ANUAL');
      expect(cicloAnual?.nome).toBe('Ciclo Anual');
    });
  });

  describe('calcularComissaoComercial', () => {
    beforeEach(async () => {
      // Criar regras comerciais
      await prisma.regraComercial.create({
        data: {
          backofficeId,
          cartaoAcessoSaude: new Decimal(5),
          cireAtivo: new Decimal(10),
          cireReceptivo: new Decimal(8),
          franchisingAcesso: new Decimal(3),
          franchisingCartao: new Decimal(4),
          unidade: new Decimal(2),
        },
      });

      // Criar regras de gestores
      await prisma.regraGestor.create({
        data: {
          backofficeId,
          gerenteCire: new Decimal(15),
          supervisorAtivo: new Decimal(10),
          supervisorReceptivo: new Decimal(8),
          supervisorFranquia: new Decimal(5),
          supervisorAtendimento: new Decimal(7),
          gerenteAtendimento: new Decimal(12),
          supervisorComercial: new Decimal(20),
        },
      });
    });

    it('deve calcular comissão para SUPERVISOR_ATIVO', async () => {
      const resultado = await calcularComissaoComercial({
        comercialId,
        valorProcedimento: 10000,
        dataReferencia: new Date('2026-03-15'),
      });

      expect(resultado.valorComissao).toBeGreaterThan(0);
      expect(resultado.percentualAplicado).toBe(0.2); // unidade=2% × supervisorAtivo=10% = 0.2%
    });

    it('deve retornar comissão zero se não houver regras', async () => {
      // Deletar regras
      await prisma.regraComercial.deleteMany({
        where: { backofficeId },
      });
      await prisma.regraGestor.deleteMany({
        where: { backofficeId },
      });

      const resultado = await calcularComissaoComercial({
        comercialId,
        valorProcedimento: 10000,
        dataReferencia: new Date('2026-03-15'),
      });

      expect(resultado.valorComissao).toBe(0);
    });

    it('deve lançar erro se comercial não existir', async () => {
      await expect(
        calcularComissaoComercial({
          comercialId: '00000000-0000-0000-0000-000000000000',
          valorProcedimento: 10000,
          dataReferencia: new Date('2026-03-15'),
        })
      ).rejects.toThrow('Comercial não encontrado');
    });
  });
});