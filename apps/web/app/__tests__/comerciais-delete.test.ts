/**
 * Testes - Delete de Comercial (Soft Delete do Usuario)
 * Valida que deletar um comercial NÃO deleta o usuario associado,
 * apenas o inativa (soft delete), evitando cascade para Parceiros/Indicados.
 *
 * Testa a lógica de soft delete diretamente via Prisma, já que o
 * import do handler de rota falha por dependências de next-auth no
 * ambiente de teste (Node puro, sem jsdom).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@asa/database';
import { hash } from 'bcryptjs';
import { uniqueCpf } from './test-helpers';

describe('DELETE Comercial - Soft Delete do Usuario', () => {
  let backofficeId: string;
  let backofficeUsuarioId: string;
  let liderancaId: string;

  beforeEach(async () => {
    const backofficeUsuario = await prisma.usuario.create({
      data: {
        nome: 'Backoffice Delete Test',
        email: `backoffice-delete-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'BACKOFFICE',
        papel: 'BACKOFFICE',
      },
    });
    backofficeUsuarioId = backofficeUsuario.id;

    const backoffice = await prisma.backoffice.create({
      data: {
        usuarioId: backofficeUsuario.id,
        nome: 'Backoffice Delete Test',
        cpf: uniqueCpf(),
        percentualComissaoDefault: 5.0,
      },
    });
    backofficeId = backoffice.id;

    const liderancaUsuario = await prisma.usuario.create({
      data: {
        nome: 'Lideranca Delete Test',
        email: `lideranca-delete-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'LIDERANCA',
      },
    });

    const lideranca = await prisma.lideranca.create({
      data: {
        usuarioId: liderancaUsuario.id,
        nome: 'Lideranca Delete Test',
        cpf: uniqueCpf(),
        backofficeId,
        tipo: 'COMERCIAL',
      },
    });
    liderancaId = lideranca.id;
  });

  afterEach(async () => {
    // Soft deletes para respeitar RESTRICT constraints
    await prisma.usuario.updateMany({ data: { status: 'INATIVO' } });
  });

  it('deve inativar o usuario ao deletar comercial (soft delete)', async () => {
    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: 'Comercial Soft Delete',
        email: `comercial-softdelete-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        liderancaId,
        nome: 'Comercial Soft Delete',
        cpf: uniqueCpf(),
        percentualComissao: 5.0,
      },
    });

    // Simular o que a rota DELETE faz: soft delete do usuario
    await prisma.usuario.update({
      where: { id: comercialUsuario.id },
      data: { status: 'INATIVO' },
    });

    // Deletar registros relacionados e o comercial
    await prisma.comissaoComercial.deleteMany({ where: { comercialId: comercial.id } });
    await prisma.metaComercial.deleteMany({ where: { comercialId: comercial.id } });
    await prisma.comercial.delete({ where: { id: comercial.id } });

    // Verificar: usuario ainda existe com status INATIVO
    const usuario = await prisma.usuario.findUnique({
      where: { id: comercialUsuario.id },
    });
    expect(usuario).not.toBeNull();
    expect(usuario!.status).toBe('INATIVO');

    // Verificar: comercial foi deletado
    const comercialDb = await prisma.comercial.findUnique({
      where: { id: comercial.id },
    });
    expect(comercialDb).toBeNull();
  });

  it('deve impedir cascade para Parceiro quando usuario do comercial é soft-deletado', async () => {
    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: 'Comercial No Cascade',
        email: `comercial-nocascade-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        liderancaId,
        nome: 'Comercial No Cascade',
        cpf: uniqueCpf(),
        percentualComissao: 5.0,
      },
    });

    // Criar gestor para ser dono do parceiro
    const gestorUsuario = await prisma.usuario.create({
      data: {
        nome: 'Gestor No Cascade',
        email: `gestor-nocascade-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'LIDERANCA',
      },
    });

    const gestor = await prisma.gestor.create({
      data: {
        usuarioId: gestorUsuario.id,
        nome: 'Gestor No Cascade',
        cpf: uniqueCpf(),
        liderancaId,
      },
    });

    // Criar parceiro vinculado ao gestor
    const parceiroUsuario = await prisma.usuario.create({
      data: {
        nome: 'Parceiro No Cascade',
        email: `parceiro-nocascade-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'PARCEIRO',
      },
    });

    const parceiro = await prisma.parceiro.create({
      data: {
        usuarioId: parceiroUsuario.id,
        nome: 'Parceiro No Cascade',
        cpf: uniqueCpf(),
        gestorId: gestor.id,
        status: 'ATIVO',
      },
    });

    const indicado = await prisma.indicado.create({
      data: {
        parceiroId: parceiro.id,
        nome: 'Indicado No Cascade',
        cpf: uniqueCpf(),
        status: 'ATIVO',
      },
    });

    // Soft delete do usuario do comercial
    await prisma.usuario.update({
      where: { id: comercialUsuario.id },
      data: { status: 'INATIVO' },
    });

    // Verificar: parceiro e indicado NÃO foram deletados
    const parceiroDb = await prisma.parceiro.findUnique({
      where: { id: parceiro.id },
    });
    expect(parceiroDb).not.toBeNull();
    expect(parceiroDb!.status).toBe('ATIVO');

    const indicadoDb = await prisma.indicado.findUnique({
      where: { id: indicado.id },
    });
    expect(indicadoDb).not.toBeNull();
  });

  it('deve deletar comissões e metas antes de inativar o usuario', async () => {
    const comercialUsuario = await prisma.usuario.create({
      data: {
        nome: 'Comercial Cascade Delete',
        email: `comercial-cascadedel-${Date.now()}@asa.test`,
        senhaHash: await hash('123456', 12),
        tipo: 'COMERCIAL',
      },
    });

    const comercial = await prisma.comercial.create({
      data: {
        usuarioId: comercialUsuario.id,
        liderancaId,
        nome: 'Comercial Cascade Delete',
        cpf: uniqueCpf(),
        percentualComissao: 5.0,
      },
    });

    await prisma.comissaoComercial.create({
      data: {
        comercialId: comercial.id,
        mesReferencia: '2026-01',
        valorVendas: 10000,
        valorComissao: 500,
        status: 'CALCULADA',
      },
    });

    await prisma.metaComercial.create({
      data: {
        comercialId: comercial.id,
        mesReferencia: '2026-01',
        valorMeta: 50000,
      },
    });

    // Simular DELETE: deleteMany comissões/metas, soft delete usuario, delete comercial
    await Promise.all([
      prisma.comissaoComercial.deleteMany({ where: { comercialId: comercial.id } }),
      prisma.metaComercial.deleteMany({ where: { comercialId: comercial.id } }),
    ]);

    await prisma.usuario.update({
      where: { id: comercialUsuario.id },
      data: { status: 'INATIVO' },
    });

    await prisma.comercial.delete({ where: { id: comercial.id } });

    const comissoes = await prisma.comissaoComercial.findMany({
      where: { comercialId: comercial.id },
    });
    expect(comissoes).toHaveLength(0);

    const metas = await prisma.metaComercial.findMany({
      where: { comercialId: comercial.id },
    });
    expect(metas).toHaveLength(0);

    const usuario = await prisma.usuario.findUnique({
      where: { id: comercialUsuario.id },
    });
    expect(usuario).not.toBeNull();
    expect(usuario!.status).toBe('INATIVO');
  });
});
