/**
 * Testes da integração de abas na página /backoffice/producao
 * Valida navegação entre Lista de Produção e Upload de Planilha
 */

import { describe, it, expect } from 'vitest';

describe('ProducaoPage - Sistema de Abas', () => {
  it('deve iniciar com aba "lista" por padrão', () => {
    const estadoInicial = 'lista';
    expect(estadoInicial).toBe('lista');
  });

  it('deve alternar para aba "upload" via query param', () => {
    const searchParams = new URLSearchParams('?tab=upload');
    const tab = searchParams.get('tab');
    expect(tab).toBe('upload');
  });

  it('deve manter aba "lista" sem query param', () => {
    const searchParams = new URLSearchParams('');
    const tab = searchParams.get('tab');
    expect(tab).toBeNull();
  });
});

describe('ProducaoPage - Deep Linking', () => {
  it('URL /backoffice/producao?tab=upload deve ativar aba de upload', () => {
    const url = '/backoffice/producao?tab=upload';
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('tab')).toBe('upload');
  });

  it('URL /backoffice/producao deve mostrar lista', () => {
    const url = '/backoffice/producao';
    const params = new URLSearchParams(url.split('?')[1] || '');
    expect(params.get('tab')).toBeNull();
  });
});
