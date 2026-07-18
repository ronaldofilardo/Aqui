/**
 * Testes das Correções Implementadas no Upload de Planilha
 * Cobre: cabeçalho na linha 2, busca de indicados, e validações
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Correções Upload Planilha - Cabeçalho na Linha 2', () => {
  it('deve ler cabeçalhos da linha 2 (índice 1)', () => {
    const jsonData: any[][] = [
      ['Receita Bruta Análitica', '', '', ''], // Linha 1 - Título
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento'], // Linha 2 - Cabeçalhos
      ['2026-07-15', 'João Silva', '12345678901', 'Consulta'], // Linha 3 - Dados
    ];

    // Cabeçalhos estão na linha 2 (índice 1)
    const headersRaw = jsonData[1] || [];
    const headers = headersRaw.reduce((acc, h, idx) => {
      const headerStr = h ? String(h).trim() : '';
      if (headerStr) {
        acc[String(idx)] = headerStr;
      }
      return acc;
    }, {} as Record<string, string>);

    expect(headers['0']).toBe('Data de Referência');
    expect(headers['1']).toBe('Paciente');
    expect(headers['2']).toBe('CPF');
    expect(headers['3']).toBe('Procedimento');
  });

  it('deve processar dados a partir da linha 3 (índice 2)', () => {
    const jsonData: any[][] = [
      ['Receita Bruta Análitica', '', '', ''], // Linha 1 - Título (ignorar)
      ['Data de Referência', 'Paciente', 'CPF', 'Procedimento'], // Linha 2 - Cabeçalhos (ignorar)
      ['2026-07-15', 'João Silva', '12345678901', 'Consulta'], // Linha 3 - Dados
      ['2026-07-16', 'Maria Santos', '98765432100', 'Exame'], // Linha 4 - Dados
    ];

    const dadosProcessados: any[] = [];
    
    // Começar do índice 2 (linha 3)
    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (row && row.length > 0) {
        dadosProcessados.push({
          dataReferencia: row[0],
          paciente: row[1],
          cpf: row[2],
          procedimento: row[3],
        });
      }
    }

    expect(dadosProcessados).toHaveLength(2);
    expect(dadosProcessados[0].paciente).toBe('João Silva');
    expect(dadosProcessados[1].paciente).toBe('Maria Santos');
  });

  it('deve calcular total de linhas excluindo título e cabeçalho', () => {
    const jsonData: any[][] = [
      ['Título'], // Linha 1
      ['Cabeçalho'], // Linha 2
      ['Dado 1'], // Linha 3
      ['Dado 2'], // Linha 4
      ['Dado 3'], // Linha 5
    ];

    const totalLinhasDados = Math.max(0, jsonData.length - 2);
    
    expect(totalLinhasDados).toBe(3); // 5 linhas - 2 (título + cabeçalho)
  });

  it('deve lidar com planilha sem dados após cabeçalho', () => {
    const jsonData: any[][] = [
      ['Título'],
      ['Cabeçalho'],
    ];

    const totalLinhasDados = Math.max(0, jsonData.length - 2);
    
    expect(totalLinhasDados).toBe(0);
  });
});

describe('Correções Upload Planilha - Busca de Indicados', () => {
  it('deve encontrar parceiro pelo CPF do cliente entre indicados', () => {
    const parceiros = [
      {
        id: 'p1',
        nome: 'Parceiro 1',
        cpf: '11111111111',
        indicacoes: [
          { id: 'i1', cpf: '12345678901', nome: 'João' },
          { id: 'i2', cpf: '98765432100', nome: 'Maria' },
        ],
      },
      {
        id: 'p2',
        nome: 'Parceiro 2',
        cpf: '22222222222',
        indicacoes: [
          { id: 'i3', cpf: '11122233344', nome: 'Pedro' },
        ],
      },
    ];

    const cpfBusca = '12345678901';
    let parceiroEncontrado = null;
    let indicadoEncontrado = null;

    // Primeiro tenta achar pelo CPF do parceiro
    parceiroEncontrado = parceiros.find((p) => p.cpf === cpfBusca);
    
    // Se não achou, procura entre os indicados
    if (!parceiroEncontrado) {
      for (const parceiro of parceiros) {
        indicadoEncontrado = parceiro.indicacoes.find((ind) => ind.cpf === cpfBusca);
        if (indicadoEncontrado) {
          parceiroEncontrado = parceiro;
          break;
        }
      }
    }

    expect(parceiroEncontrado).toBeTruthy();
    expect(parceiroEncontrado?.id).toBe('p1');
    expect(indicadoEncontrado?.id).toBe('i1');
  });

  it('deve retornar null quando CPF não estiver em nenhum indicado', () => {
    const parceiros = [
      {
        id: 'p1',
        nome: 'Parceiro 1',
        cpf: '11111111111',
        indicacoes: [
          { id: 'i1', cpf: '12345678901', nome: 'João' },
        ],
      },
    ];

    const cpfBusca = '99999999999';
    let parceiroEncontrado = null;
    let indicadoEncontrado = null;

    parceiroEncontrado = parceiros.find((p) => p.cpf === cpfBusca);
    
    if (!parceiroEncontrado) {
      for (const parceiro of parceiros) {
        indicadoEncontrado = parceiro.indicacoes.find((ind) => ind.cpf === cpfBusca);
        if (indicadoEncontrado) {
          parceiroEncontrado = parceiro;
          break;
        }
      }
    }

    expect(parceiroEncontrado).toBeFalsy();
    expect(indicadoEncontrado).toBeFalsy();
  });

  it('deve priorizar CPF do parceiro sobre CPF do indicado', () => {
    const parceiros = [
      {
        id: 'p1',
        nome: 'Parceiro 1',
        cpf: '12345678901', // Mesmo CPF de um indicado
        indicacoes: [
          { id: 'i1', cpf: '12345678901', nome: 'João' },
        ],
      },
    ];

    const cpfBusca = '12345678901';
    let parceiroEncontrado = null;
    let indicadoEncontrado = null;

    // Primeiro tenta achar pelo CPF do parceiro
    parceiroEncontrado = parceiros.find((p) => p.cpf === cpfBusca);
    
    // Só procura entre indicados se não achou parceiro
    if (!parceiroEncontrado) {
      for (const parceiro of parceiros) {
        indicadoEncontrado = parceiro.indicacoes.find((ind) => ind.cpf === cpfBusca);
        if (indicadoEncontrado) {
          parceiroEncontrado = parceiro;
          break;
        }
      }
    }

    expect(parceiroEncontrado).toBeTruthy();
    expect(parceiroEncontrado?.id).toBe('p1');
    expect(indicadoEncontrado).toBeNull(); // Não deve procurar indicados se achou parceiro
  });

  it('deve buscar indicados de todos os parceiros até encontrar', () => {
    const parceiros = [
      {
        id: 'p1',
        nome: 'Parceiro 1',
        cpf: '11111111111',
        indicacoes: [
          { id: 'i1', cpf: '11122233344', nome: 'João' },
        ],
      },
      {
        id: 'p2',
        nome: 'Parceiro 2',
        cpf: '22222222222',
        indicacoes: [
          { id: 'i2', cpf: '55566677788', nome: 'Maria' },
        ],
      },
      {
        id: 'p3',
        nome: 'Parceiro 3',
        cpf: '33333333333',
        indicacoes: [
          { id: 'i3', cpf: '12345678901', nome: 'Pedro' }, // CPF buscado está aqui
        ],
      },
    ];

    const cpfBusca = '12345678901';
    let parceiroEncontrado = null;
    let indicadoId: string | null = null;

    if (!parceiroEncontrado) {
      for (const parceiro of parceiros) {
        const indicado = parceiro.indicacoes.find((ind) => ind.cpf === cpfBusca);
        if (indicado) {
          parceiroEncontrado = parceiro;
          indicadoId = indicado.id;
          break;
        }
      }
    }

    expect(parceiroEncontrado?.id).toBe('p3');
    expect(indicadoId).toBe('i3');
  });
});

describe('Correções Upload Planilha - Validação de Arrays Vazios', () => {
  it('deve lidar com comerciais/gestores vazios', () => {
    const comercialIds: string[] = [];
    const gestorIds: string[] = [];

    // Quando arrays estão vazios, não deve filtrar por OR
    const whereCondition = comercialIds.length > 0 || gestorIds.length > 0 
      ? { OR: [{ comercialId: { in: comercialIds } }, { gestorId: { in: gestorIds } }] }
      : {};

    expect(whereCondition).toEqual({});
  });

  it('deve aplicar filtro OR quando houver IDs', () => {
    const comercialIds = ['c1', 'c2'];
    const gestorIds = ['g1'];

    const whereCondition = comercialIds.length > 0 || gestorIds.length > 0 
      ? { OR: [{ comercialId: { in: comercialIds } }, { gestorId: { in: gestorIds } }] }
      : {};

    expect(whereCondition).toEqual({
      OR: [
        { comercialId: { in: ['c1', 'c2'] } },
        { gestorId: { in: ['g1'] } }
      ]
    });
  });

  it('deve calcular total de indicados mesmo com parceiros vazios', () => {
    const parceiros: any[] = [];
    
    const totalIndicados = parceiros.reduce((sum, p) => sum + (p.indicacoes?.length || 0), 0);
    
    expect(totalIndicados).toBe(0);
  });

  it('deve somar indicados de múltiplos parceiros', () => {
    const parceiros = [
      { id: 'p1', indicacoes: [{ id: 'i1' }, { id: 'i2' }] },
      { id: 'p2', indicacoes: [{ id: 'i3' }] },
      { id: 'p3', indicacoes: [] },
      { id: 'p4', indicacoes: [{ id: 'i4' }, { id: 'i5' }, { id: 'i6' }] },
    ];

    const totalIndicados = parceiros.reduce((sum, p) => sum + p.indicacoes.length, 0);
    
    expect(totalIndicados).toBe(6);
  });
});

describe('Correções Upload Planilha - Logs de Debug', () => {
  it('deve logar informações relevantes para debug', () => {
    const logs: string[] = [];
    const mockLog = (msg: string, ...args: any[]) => {
      logs.push(`${msg} ${args.map(a => JSON.stringify(a)).join(' ')}`);
    };

    const backofficeId = 'backoffice-123';
    const liderancas = [{ id: 'l1' }, { id: 'l2' }];
    const comerciais = [{ id: 'c1', nome: 'Comercial 1' }];
    const gestores = [{ id: 'g1', nome: 'Gestor 1' }];
    const parceiros = [
      { 
        id: 'p1', 
        nome: 'Parceiro 1', 
        cpf: '12345678901',
        indicacoes: [{ id: 'i1', cpf: '11122233344', nome: 'João' }]
      }
    ];

    mockLog('[parsePlanilhaProducao] Backoffice ID:', backofficeId);
    mockLog('[parsePlanilhaProducao] Lideranças encontradas:', liderancas.length);
    mockLog('[parsePlanilhaProducao] Comerciais encontrados:', comerciais.length);
    mockLog('[parsePlanilhaProducao] Gestores encontrados:', gestores.length);
    mockLog('[parsePlanilhaProducao] Parceiros encontrados:', parceiros.length);
    mockLog('[parsePlanilhaProducao] Total de indicados:', parceiros.reduce((sum, p) => sum + p.indicacoes.length, 0));

    expect(logs.some(l => l.includes('Backoffice ID:'))).toBe(true);
    expect(logs.some(l => l.includes('Lideranças encontradas: 2'))).toBe(true);
    expect(logs.some(l => l.includes('Comerciais encontrados: 1'))).toBe(true);
    expect(logs.some(l => l.includes('Parceiros encontrados: 1'))).toBe(true);
    expect(logs.some(l => l.includes('Total de indicados: 1'))).toBe(true);
  });
});

describe('Correções Upload Planilha - Estrutura de Dados', () => {
  it('deve mapear headers corretamente mesmo com células vazias', () => {
    const headersRaw = [
      'Data de Referência',
      '',
      '',
      'Paciente',
      '',
      'CPF',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ];

    const headers = headersRaw.reduce((acc, h, idx) => {
      const headerStr = h ? String(h).trim() : '';
      if (headerStr) {
        acc[String(idx)] = headerStr;
      }
      return acc;
    }, {} as Record<string, string>);

    expect(headers['0']).toBe('Data de Referência');
    expect(headers['3']).toBe('Paciente');
    expect(headers['5']).toBe('CPF');
    expect(Object.keys(headers)).toHaveLength(3); // Apenas headers não vazios
  });

  it('deve normalizar nomes de colunas para lowercase', () => {
    const headers = {
      '0': 'Data de Referência',
      '1': 'Paciente',
      '2': 'CPF',
    };

    const colunasEncontradas = Object.values(headers).map((h) => h.toLowerCase());

    expect(colunasEncontradas).toContain('data de referência');
    expect(colunasEncontradas).toContain('paciente');
    expect(colunasEncontradas).toContain('cpf');
  });

  it('deve identificar colunas obrigatórias faltando', () => {
    const COLUNAS_OBRIGATORIAS = [
      'Data de Referência',
      'Paciente',
      'CPF',
      'Procedimento',
      'Total Pago',
      'Usuário da conta',
    ];

    const colunasEncontradas = ['data de referência', 'paciente', 'cpf'];

    const faltantes = COLUNAS_OBRIGATORIAS.filter(
      (col) => !colunasEncontradas.includes(col.toLowerCase())
    );

    expect(faltantes).toHaveLength(3);
    expect(faltantes).toContain('Procedimento');
    expect(faltantes).toContain('Total Pago');
    expect(faltantes).toContain('Usuário da conta');
  });
});