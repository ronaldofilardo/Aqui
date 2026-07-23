/**
 * Testes de Integração - API Backoffice End-to-End
 * Testa fluxos completos da API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { uniqueCpf } from './test-helpers';

describe('API Backoffice - Testes de Integração', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;

  beforeEach(async () => {
    // Setup completo para testes de integração
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Integration Test',
        email: `backoffice-integration-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: 'Backoffice Integration',
        cpf: uniqueCpf(),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: 'Lideranca Integration Test',
        email: `lideranca-integration-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'LIDERANCA',
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: 'Lideranca Integration',
        cpf: uniqueCpf(),
        backofficeId,
        tipo: 'COMERCIAL',
      },
    });
    liderancaId = lideranca.id;
  });

  afterEach(async () => {
    await prisma.lideranca.deleteMany({ where: { usuario: { email: { endsWith: "@asa.test" } } } }).catch(() => {});
    await prisma.backoffice.deleteMany({ where: { usuario: { email: { endsWith: "@asa.test" } } } }).catch(() => {});
    await prisma.usuario.deleteMany({ where: { email: { endsWith: "@asa.test" } } }).catch(() => {});
  });

  describe('Fluxo Completo - Gestão de Comerciais', () => {
    it('deve criar, listar, atualizar e deletar comercial', async () => {
      // 1. Criar comercial
      const comercialUsuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial Full Cycle',
          email: `comercial-fullcycle-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: comercialUsuario.id,
          liderancaId,
          nome: 'Comercial Full Cycle',
          cpf: uniqueCpf(),
          percentualComissao: 7.5,
          status: 'ATIVO',
        },
      });

      expect(comercial.id).toBeDefined();
      expect(comercial.nome).toBe('Comercial Full Cycle');
      expect(Number(comercial.percentualComissao)).toBe(7.5);

      // 2. Listar comerciais
      const liderancas = await prisma.lideranca.findMany({
        where: { backofficeId },
        include: {
          comerciais: {
            include: {
              usuario: { select: { email: true, status: true } },
            },
          },
        },
      });

      const comerciais = liderancas.flatMap(l => l.comerciais);
      expect(comerciais.length).toBeGreaterThan(0);
      expect(comerciais.some(c => c.id === comercial.id)).toBe(true);

      // 3. Atualizar comercial
      const updated = await prisma.comercial.update({
        where: { id: comercial.id },
        data: { percentualComissao: 10.0 },
      });

      expect(Number(updated.percentualComissao)).toBe(10.0);

      // 4. Deletar comercial
      await prisma.comercial.delete({ where: { id: comercial.id } });
      await prisma.usuario.delete({ where: { id: comercialUsuario.id } });

      const deleted = await prisma.comercial.findUnique({
        where: { id: comercial.id },
      });
      expect(deleted).toBeNull();
    });
  });

  describe('Fluxo Completo - Comissões e Regras', () => {
    it('deve criar regras, comercial e calcular comissão', async () => {
      // 1. Criar regras comerciais
      const regraComercial = await prisma.regraComercial.create({
        data: {
          backofficeId,
          cartaoAcessoSaude: 5,
          cireAtivo: 10,
          cireReceptivo: 8,
          franchisingAcesso: 3,
          franchisingCartao: 4,
          unidade: 2,
        },
      });

      expect(regraComercial.id).toBeDefined();
      expect(Number(regraComercial.cireAtivo)).toBe(10);

      // 2. Criar regras de gestores
      const regraGestor = await prisma.regraGestor.create({
        data: {
          backofficeId,
          gerenteCire: 15,
          supervisorAtivo: 10,
          supervisorReceptivo: 8,
          supervisorFranquia: 5,
          supervisorAtendimento: 7,
          gerenteAtendimento: 12,
          supervisorComercial: 20,
        },
      });

      expect(regraGestor.id).toBeDefined();
      expect(Number(regraGestor.gerenteCire)).toBe(15);

      // 3. Criar comercial com as regras
      const comercialUsuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial Comissao',
          email: `comercial-comissao-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: comercialUsuario.id,
          liderancaId,
          nome: 'Comercial Comissao',
          cpf: uniqueCpf(),
          percentualComissao: 8.0,
          funcao: 'SUPERVISOR_ATIVO',
        },
      });

      // 4. Criar comissão
      const comissao = await prisma.comissaoComercial.create({
        data: {
          comercialId: comercial.id,
          mesReferencia: '2026-03',
          valorVendas: 100000,
          valorComissao: 8000, // 8%
          status: 'CALCULADA',
        },
      });

      expect(comissao.id).toBeDefined();
      expect(Number(comissao.valorVendas)).toBe(100000);
      expect(Number(comissao.valorComissao)).toBe(8000);

      // 5. Criar meta
      const meta = await prisma.metaComercial.create({
        data: {
          comercialId: comercial.id,
          mesReferencia: '2026-03',
          valorMeta: 120000,
          valorAtingido: 100000,
        },
      });

      expect(meta.id).toBeDefined();
      expect(Number(meta.valorAtingido) / Number(meta.valorMeta)).toBeCloseTo(0.833, 2);

      // Cleanup
      await prisma.metaComercial.deleteMany({ where: { comercialId: comercial.id } });
      await prisma.comissaoComercial.deleteMany({ where: { comercialId: comercial.id } });
      await prisma.comercial.delete({ where: { id: comercial.id } });
      await prisma.regraGestor.delete({ where: { id: regraGestor.id } });
      await prisma.regraComercial.delete({ where: { id: regraComercial.id } });
      await prisma.usuario.deleteMany({ 
        where: { id: { in: [comercialUsuario.id] } } 
      });
    });

    it('deve criar e atualizar regras comerciais e de gestores', async () => {
      // 1. Criar regras comerciais iniciais
      const regraComercialInicial = await prisma.regraComercial.create({
        data: {
          backofficeId,
          cartaoAcessoSaude: 5,
          cireAtivo: 10,
          cireReceptivo: 8,
          franchisingAcesso: 3,
          franchisingCartao: 4,
          unidade: 2,
        },
      });

      expect(regraComercialInicial.id).toBeDefined();
      expect(Number(regraComercialInicial.cireAtivo)).toBe(10);

      // 2. Atualizar regras comerciais
      const regraComercialAtualizada = await prisma.regraComercial.update({
        where: { id: regraComercialInicial.id },
        data: {
          cartaoAcessoSaude: 6,
          cireAtivo: 12,
          cireReceptivo: 9,
          franchisingAcesso: 4,
          franchisingCartao: 5,
          unidade: 3,
        },
      });

      expect(Number(regraComercialAtualizada.cireAtivo)).toBe(12);
      expect(Number(regraComercialAtualizada.cartaoAcessoSaude)).toBe(6);

      // 3. Criar regras de gestores iniciais
      const regraGestorInicial = await prisma.regraGestor.create({
        data: {
          backofficeId,
          gerenteCire: 15,
          supervisorAtivo: 10,
          supervisorReceptivo: 8,
          supervisorFranquia: 5,
          supervisorAtendimento: 7,
          gerenteAtendimento: 12,
          supervisorComercial: 20,
        },
      });

      expect(regraGestorInicial.id).toBeDefined();
      expect(Number(regraGestorInicial.gerenteCire)).toBe(15);

      // 4. Atualizar regras de gestores
      const regraGestorAtualizada = await prisma.regraGestor.update({
        where: { id: regraGestorInicial.id },
        data: {
          gerenteCire: 18,
          supervisorAtivo: 12,
          supervisorReceptivo: 10,
          supervisorFranquia: 6,
          supervisorAtendimento: 8,
          gerenteAtendimento: 14,
          supervisorComercial: 22,
        },
      });

      expect(Number(regraGestorAtualizada.gerenteCire)).toBe(18);
      expect(Number(regraGestorAtualizada.supervisorAtivo)).toBe(12);

      // 5. Testar valores zerados
      const regraGestorZerada = await prisma.regraGestor.create({
        data: {
          backofficeId,
          gerenteCire: 0,
          supervisorAtivo: 0,
          supervisorReceptivo: 0,
          supervisorFranquia: 0,
          supervisorAtendimento: 0,
          gerenteAtendimento: 0,
          supervisorComercial: 0,
        },
      });

      expect(Number(regraGestorZerada.gerenteCire)).toBe(0);
      expect(Number(regraGestorZerada.supervisorAtivo)).toBe(0);

      // Cleanup
      await prisma.regraGestor.deleteMany({ where: { backofficeId } });
      await prisma.regraComercial.deleteMany({ where: { backofficeId } });
    });
  });

  describe('Fluxo Completo - Upload e Processamento', () => {
    it('deve criar upload e procedimentos associados', async () => {
      // 1. Criar upload
      const upload = await prisma.uploadPlanilhaBackoffice.create({
        data: {
          backofficeId,
          nomeArquivo: 'teste-integracao.xlsx',
          mesReferencia: '2026-03',
          status: 'PROCESSANDO',
          totalRows: 100,
        },
      });

      expect(upload.id).toBeDefined();
      expect(upload.nomeArquivo).toBe('teste-integracao.xlsx');

      // 2. Criar parceiro
      const parceiroUsuario = await prisma.usuario.create({
        data: {
          nome: 'Parceiro Upload',
          email: `parceiro-upload-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'PARCEIRO',
        },
      });

      const comercialUsuario = await prisma.usuario.create({
        data: {
          nome: 'Comercial Upload',
          email: `comercial-upload-${Date.now()}@asa.test`,
          senhaHash: await hash('123456', 12),
          tipo: 'COMERCIAL',
        },
      });

      const comercial = await prisma.comercial.create({
        data: {
          usuarioId: comercialUsuario.id,
          liderancaId,
          nome: 'Comercial Upload',
          cpf: uniqueCpf(),
          percentualComissao: 5.0,
        },
      });

      const parceiro = await prisma.parceiro.create({
        data: {
          usuarioId: parceiroUsuario.id,
          comercialId: comercial.id,
          nome: 'Parceiro Upload',
          cpf: uniqueCpf(),
          status: 'ATIVO',
        },
      });

      // 3. Criar indicado (cliente) vinculado ao parceiro
      const indicado = await prisma.indicado.create({
        data: {
          parceiroId: parceiro.id,
          nome: 'Cliente Teste',
          cpf: uniqueCpf(),
          telefone: '11999999999',
          status: 'ATIVO' as any,
        },
      });

      // 5. Criar procedimento do upload
      const procedimento = await prisma.procedimentoPF.create({
        data: {
          dataReferencia: new Date('2026-03-15'),
          dataPagamento: new Date('2026-03-20'),
          formaPagamento: 'CARTAO_CREDITO',
          totalPago: 1500,
          paciente: 'Paciente Teste',
          procedimento: 'Consulta',
          cpf: indicado.cpf,
          tipoProcedimento: 'CIRE',
          unidade: 'Unidade Central',
          uploadId: upload.id,
          parceiroId: parceiro.id,
          indicadoId: indicado.id,
          comercialId: comercial.id,
          valorComissao: 75, // 5%
          statusComissao: 'CALCULADA',
        },
      });

      expect(procedimento.id).toBeDefined();
      expect(Number(procedimento.totalPago)).toBe(1500);
      expect(Number(procedimento.valorComissao)).toBe(75);

      // 6. Atualizar upload como concluído
      const uploadConcluido = await prisma.uploadPlanilhaBackoffice.update({
        where: { id: upload.id },
        data: {
          status: 'CONCLUIDO',
          processedRows: 1,
        },
      });

      expect(uploadConcluido.status).toBe('CONCLUIDO');

      // Cleanup
      await prisma.procedimentoPF.deleteMany({ where: { uploadId: upload.id } });
      await prisma.indicado.delete({ where: { id: indicado.id } });
      await prisma.parceiro.deleteMany({ where: { comercialId: comercial.id } });
      await prisma.comercial.delete({ where: { id: comercial.id } });
      await prisma.uploadPlanilhaBackoffice.delete({ where: { id: upload.id } });
      await prisma.usuario.deleteMany({ 
        where: { id: { in: [parceiroUsuario.id, comercialUsuario.id] } } 
      });
    });
  });
});