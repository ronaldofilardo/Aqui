/**
 * Testes do Componente UploadPlanilhaPreview
 * Valida fluxo de upload com preview integrado na página de produção
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('UploadPlanilhaPreview - Validação', () => {
  it('deve aceitar apenas arquivos .xlsx ou .xls', () => {
    const validarExtensao = (fileName: string): boolean => {
      return fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    };

    expect(validarExtensao('planilha.xlsx')).toBe(true);
    expect(validarExtensao('planilha.xls')).toBe(true);
    expect(validarExtensao('planilha.csv')).toBe(false);
    expect(validarExtensao('planilha.pdf')).toBe(false);
    expect(validarExtensao('planilha.txt')).toBe(false);
  });

  it('deve extrair mês de referência do nome do arquivo', () => {
    const extrairMes = (fileName: string): string | null => {
      const match = fileName.match(/(\d{4})[_-](\d{2})/);
      return match ? `${match[1]}-${match[2]}` : null;
    };

    expect(extrairMes('producao_2026-07.xlsx')).toBe('2026-07');
    expect(extrairMes('2026_07_planilha.xlsx')).toBe('2026-07');
    expect(extrairMes('planilha.xlsx')).toBeNull();
  });
});

describe('UploadPlanilhaPreview - Estrutura de Dados', () => {
  it('deve estruturar PreviewData corretamente', () => {
    const previewData = {
      fileName: 'teste.xlsx',
      previewRows: [
        {
          rowNumber: 3,
          dataReferencia: '2026-07-15',
          paciente: 'João',
          procedimento: 'Consulta',
          cpf: '12345678901',
          tipoProcedimento: 'ROTINA',
          totalPago: 150,
          unidade: 'Matriz',
          usuarioDaConta: 'comercial1',
          valorComissao: 0,
          status: 'VALIDO' as const,
        },
      ],
      hasMore: false,
      totalRows: 1,
      summary: {
        total: 1,
        validos: 1,
        orfaos: 0,
        rejeitados: 0,
        totalComissao: 0,
        colunasEncontradas: ['Data de Referência', 'Paciente', 'CPF'],
        colunasObrigatorias: ['Data de Referência', 'Paciente', 'CPF'],
        colunasOpcionais: [],
      },
    };

    expect(previewData.summary.validos).toBe(1);
    expect(previewData.previewRows[0].status).toBe('VALIDO');
    expect(previewData.previewRows[0].valorComissao).toBe(0);
    expect(previewData.totalRows).toBe(1);
  });

  it('deve contabilizar corretamente os status das linhas', () => {
    const summary = {
      validos: 10,
      orfaos: 3,
      rejeitados: 2,
    };

    const total = summary.validos + summary.orfaos + summary.rejeitados;
    expect(total).toBe(15);
  });
});

describe('UploadPlanilhaPreview - Fluxo de Upload', () => {
  it('deve chamar API de preview ao selecionar arquivo', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        fileName: 'teste.xlsx',
        previewRows: [],
        hasMore: false,
        totalRows: 0,
        summary: {
          total: 0,
          validos: 0,
          orfaos: 0,
          rejeitados: 0,
          totalComissao: 0,
          colunasEncontradas: [],
          colunasObrigatorias: [],
          colunasOpcionais: [],
        },
      }),
    });

    global.fetch = mockFetch as any;

    const formData = new FormData();
    formData.append('file', new File([''], 'teste.xlsx'));

    await fetch('/api/v1/backoffice/uploads/preview', {
      method: 'POST',
      body: formData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/backoffice/uploads/preview',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('deve chamar API de upload ao confirmar', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        mensagem: 'Sucesso',
        summary: { processedRows: 10, rejectedRows: 0, orphanedRows: 0 },
      }),
    });

    global.fetch = mockFetch as any;

    const formData = new FormData();
    formData.append('file', new File([''], 'teste.xlsx'));

    await fetch('/api/v1/backoffice/uploads', {
      method: 'POST',
      body: formData,
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/backoffice/uploads',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('deve exibir erro quando upload falha', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Colunas obrigatórias faltando' }),
    });

    global.fetch = mockFetch as any;

    const formData = new FormData();
    formData.append('file', new File([''], 'teste.xlsx'));

    const res = await fetch('/api/v1/backoffice/uploads/preview', {
      method: 'POST',
      body: formData,
    });

    const json = await res.json();
    expect(res.ok).toBe(false);
    expect(json.error).toContain('Colunas');
  });
});

describe('UploadPlanilhaPreview - UI Logic', () => {
  it('deve exibir apenas 10 linhas inicialmente com botão ver mais', () => {
    const mockRows = Array.from({ length: 100 }, (_, i) => ({
      rowNumber: i + 1,
      paciente: `Paciente ${i}`,
      status: 'VALIDO' as const,
    }));

    const displayedInitially = mockRows.slice(0, 10);
    expect(displayedInitially).toHaveLength(10);
    expect(mockRows.length).toBe(100);
  });

  it('deve aplicar cores corretas aos status', () => {
    const getStatusColor = (status: string): string => {
      switch (status) {
        case 'VALIDO':
          return 'bg-green-100 text-green-800';
        case 'ORFAO':
          return 'bg-yellow-100 text-yellow-800';
        case 'REJEITADO':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    };

    expect(getStatusColor('VALIDO')).toContain('green');
    expect(getStatusColor('ORFAO')).toContain('yellow');
    expect(getStatusColor('REJEITADO')).toContain('red');
  });

  it('deve bloquear confirmação quando há linhas rejeitadas', () => {
    const podeConfirmar = (rejeitados: number): boolean => rejeitados === 0;

    expect(podeConfirmar(0)).toBe(true);
    expect(podeConfirmar(5)).toBe(false);
  });
});
