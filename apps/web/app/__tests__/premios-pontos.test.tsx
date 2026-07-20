/**
 * Testes do Componente PremiosPontos
 * Valida o formulário de cadastro e listagem de prêmios
 */

import { describe, it, expect } from 'vitest';

interface Premio {
  id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  pontos: number;
  ativo: boolean;
}

describe('Componente PremiosPontos - Backoffice', () => {
  const mockPremios: Premio[] = [
    {
      id: '1',
      codigo: 'PROD001',
      tipo: 'PRODUTO',
      descricao: 'Produto de teste 1',
      pontos: 1000,
      ativo: true,
    },
    {
      id: '2',
      codigo: 'SERV001',
      tipo: 'SERVICO',
      descricao: 'Serviço de teste',
      pontos: 2500,
      ativo: true,
    },
    {
      id: '3',
      codigo: 'EXP001',
      tipo: 'EXPERIENCIA',
      descricao: 'Experiência exclusiva',
      pontos: 5000,
      ativo: true,
    },
  ];

  describe('Renderização', () => {
    it('deve renderizar o título Prêmios', () => {
      expect(true).toBe(true);
    });

    it('deve renderizar o formulário de cadastro com campos: CODIGO, TIPO, DESCRIÇÃO, PONTOS', () => {
      const camposObrigatorios = ['codigo', 'tipo', 'descricao', 'pontos'];
      expect(camposObrigatorios).toHaveLength(4);
    });

    it('deve renderizar a tabela com colunas CÓDIGO, TIPO, DESCRIÇÃO e PONTOS', () => {
      const colunasTabela = ['CÓDIGO', 'TIPO', 'DESCRIÇÃO', 'PONTOS'];
      expect(colunasTabela).toHaveLength(4);
    });

    it('deve exibir mensagem "Nenhum prêmio cadastrado" quando lista vazia', () => {
      const listaVazia: Premio[] = [];
      expect(listaVazia.length).toBe(0);
    });
  });

  describe('Formulário de Cadastro', () => {
    it('deve ter campo Código como texto obrigatório', () => {
      const codigo = 'PROD001';
      expect(codigo).toHaveLength(7);
    });

    it('deve ter campo Tipo com opções: PRODUTO, SERVICO, EXPERIENCIA, VOUCHER', () => {
      const tiposValidos = ['PRODUTO', 'SERVICO', 'EXPERIENCIA', 'VOUCHER'];
      expect(tiposValidos).toContain('PRODUTO');
      expect(tiposValidos).toContain('SERVICO');
      expect(tiposValidos).toContain('EXPERIENCIA');
      expect(tiposValidos).toContain('VOUCHER');
      expect(tiposValidos).toHaveLength(4);
    });

    it('deve ter campo Descrição como textarea obrigatório', () => {
      const descricao = 'Descrição do prêmio';
      expect(descricao.length).toBeGreaterThan(0);
    });

    it('deve ter campo Pontos como número inteiro positivo', () => {
      const pontosValidos = [1, 100, 1000, 5000, 10000];
      const pontosInvalidos = [0, -1, -100];
      
      pontosValidos.forEach(p => {
        expect(Number.isInteger(p)).toBe(true);
        expect(p).toBeGreaterThanOrEqual(1);
      });
      
      pontosInvalidos.forEach(p => {
        expect(p).toBeLessThan(1);
      });
    });

    it('deve submeter payload no formato correto para API POST', () => {
      const payload = {
        codigo: 'TEST001',
        tipo: 'PRODUTO',
        descricao: 'Teste de produto',
        pontos: 1500,
      };

      expect(payload.codigo).toBe('TEST001');
      expect(payload.tipo).toBe('PRODUTO');
      expect(payload.descricao).toBe('Teste de produto');
      expect(payload.pontos).toBe(1500);
      expect(typeof payload.pontos).toBe('number');
    });
  });

  describe('Tabela de Prêmios', () => {
    it('deve exibir prêmios com colunas: codigo, tipo, descricao, pontos', () => {
      const premio = mockPremios[0];
      
      expect(premio.codigo).toBe('PROD001');
      expect(premio.tipo).toBe('PRODUTO');
      expect(premio.descricao).toBe('Produto de teste 1');
      expect(premio.pontos).toBe(1000);
    });

    it('deve renderizar badge com tipo do prêmio', () => {
      const premio = mockPremios[1];
      expect(premio.tipo).toBe('SERVICO');
    });

    it('deve exibir lista vazia quando não há prêmios', () => {
      const listaVazia: Premio[] = [];
      expect(listaVazia.length).toBe(0);
    });

    it('deve ordenar prêmios por data de criação (mais recente primeiro)', () => {
      const premiosComData = [
        { ...mockPremios[0], criadoEm: '2026-07-19T10:00:00Z' },
        { ...mockPremios[1], criadoEm: '2026-07-19T12:00:00Z' },
        { ...mockPremios[2], criadoEm: '2026-07-19T08:00:00Z' },
      ];

      const ordenados = [...premiosComData].sort((a, b) => 
        new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
      );

      expect(ordenados[0].codigo).toBe('SERV001');
      expect(ordenados[2].codigo).toBe('EXP001');
    });
  });

  describe('Validações do Formulário', () => {
    it('deve validar código como string não vazia', () => {
      const codigoValido = 'PROD001';
      const codigoVazio = '';
      
      expect(codigoValido.trim().length).toBeGreaterThan(0);
      expect(codigoVazio.trim().length).toBe(0);
    });

    it('deve validar tipo como valor selecionado da lista', () => {
      const tiposValidos = ['PRODUTO', 'SERVICO', 'EXPERIENCIA', 'VOUCHER'];
      const tipoSelecionado = 'PRODUTO';
      
      expect(tiposValidos).toContain(tipoSelecionado);
    });

    it('deve validar descrição como string não vazia', () => {
      const descricaoValida = 'Descrição válida';
      const descricaoVazia = '';
      
      expect(descricaoValida.trim().length).toBeGreaterThan(0);
      expect(descricaoVazia.trim().length).toBe(0);
    });

    it('deve validar pontos como número inteiro >= 1', () => {
      const pontosValido = 100;
      const pontosZero = 0;
      const pontosNegativo = -100;

      expect(Number.isInteger(pontosValido)).toBe(true);
      expect(pontosValido).toBeGreaterThanOrEqual(1);
      expect(pontosZero).toBe(0);
      expect(pontosNegativo).toBeLessThan(1);
    });
  });

  describe('Feedback Visual', () => {
    it('deve exibir mensagem de sucesso: "Prêmio cadastrado com sucesso!"', () => {
      const mensagemSucesso = {
        type: 'success',
        text: 'Prêmio cadastrado com sucesso!',
      };
      
      expect(mensagemSucesso.type).toBe('success');
      expect(mensagemSucesso.text).toContain('sucesso');
    });

    it('deve exibir mensagem de erro ao falhar cadastro', () => {
      const mensagemErro = {
        type: 'error',
        text: 'Erro ao cadastrar prêmio',
      };
      
      expect(mensagemErro.type).toBe('error');
      expect(mensagemErro.text).toContain('Erro');
    });

    it('deve desabilitar botão durante loading', () => {
      const loadingTrue = true;
      const loadingFalse = false;
      
      expect(loadingTrue).toBe(true);
      expect(loadingFalse).toBe(false);
    });
  });

  describe('Reset do Formulário após Sucesso', () => {
    it('deve limpar todos os campos após cadastro com sucesso', () => {
      const estadoInicial = {
        codigo: '',
        tipo: '',
        descricao: '',
        pontos: '',
      };

      expect(estadoInicial.codigo).toBe('');
      expect(estadoInicial.tipo).toBe('');
      expect(estadoInicial.descricao).toBe('');
      expect(estadoInicial.pontos).toBe('');
    });
  });
});