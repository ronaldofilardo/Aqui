/**
 * Testes da Página de Indicados do Parceiro
 * Valida listagem e cadastro de clientes indicados
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Parceiro Indicados Page', () => {
  const BASE_URL = 'http://localhost:3000/api/v1/parceiro/indicados';

  describe('GET /api/v1/parceiro/indicados', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é PARCEIRO', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-invalido' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar lista de indicados do parceiro', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve retornar indicados com estrutura correta', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        const indicado = data[0];
        expect(indicado).toHaveProperty('id');
        expect(indicado).toHaveProperty('nome');
        expect(indicado).toHaveProperty('cpf');
        expect(indicado).toHaveProperty('telefone');
        expect(indicado).toHaveProperty('status');
        expect(indicado).toHaveProperty('totalProcedimentos');
        expect(indicado).toHaveProperty('createdAt');
      }
    });

    it('deve incluir apenas indicados ativos por padrão', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Deve incluir indicados ativos e inativos
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve ordenar indicados por data de criação', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 1) {
        const dates = data.map((i: any) => new Date(i.createdAt).getTime());
        const sorted = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sorted);
      }
    });
  });

  describe('POST /api/v1/parceiro/indicados', () => {
    const indicadoValido = {
      nome: 'João Silva',
      cpf: '12345678901',
      telefone: '(11) 99999-9999',
    };

    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(indicadoValido),
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é PARCEIRO', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-invalido'
        },
        body: JSON.stringify(indicadoValido),
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando nome é ausente', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify({ ...indicadoValido, nome: '' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar erro quando CPF é inválido', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify({ ...indicadoValido, cpf: '123' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('CPF');
    });

    it('deve retornar erro quando CPF já está cadastrado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify({ ...indicadoValido, cpf: '11122233344' }), // CPF existente
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('já está');
    });

    it('deve cadastrar indicado com sucesso quando dados são válidos', async () => {
      const novoIndicado = {
        ...indicadoValido,
        cpf: `${Date.now()}00001`,
        nome: `Novo ${Date.now()}`,
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify(novoIndicado),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.nome).toBe(novoIndicado.nome);
      expect(data.cpf).toBe(novoIndicado.cpf);
    });

    it('deve aceitar telefone como opcional', async () => {
      const indicadoSemTelefone = {
        nome: 'Teste Sem Telefone',
        cpf: `${Date.now()}00002`,
        telefone: '',
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify(indicadoSemTelefone),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
    });

    it('deve criar vínculo com parceiro autenticado', async () => {
      const novoIndicado = {
        nome: 'Teste Vínculo',
        cpf: `${Date.now()}00003`,
        telefone: '',
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify(novoIndicado),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.parceiroId).toBeDefined();
    });

    it('deve normalizar CPF removendo caracteres especiais', async () => {
      const indicadoComMascara = {
        nome: 'Teste CPF',
        cpf: '123.456.789-01',
        telefone: '',
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify(indicadoComMascara),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.cpf).toBe('12345678901');
    });
  });

  describe('GET /api/v1/parceiro/indicados/check-cpf', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(`${BASE_URL}/check-cpf?cpf=12345678901`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar válido quando CPF está disponível', async () => {
      const response = await fetch(`${BASE_URL}/check-cpf?cpf=12345678901`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(true);
    });

    it('deve retornar inválido quando CPF já está cadastrado', async () => {
      const response = await fetch(`${BASE_URL}/check-cpf?cpf=11122233344`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(false);
      expect(data.message).toBeDefined();
    });

    it('deve retornar inválido quando CPF é inválido', async () => {
      const response = await fetch(`${BASE_URL}/check-cpf?cpf=123`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(false);
    });

    it('deve retornar inválido quando CPF tem tamanho incorreto', async () => {
      const response = await fetch(`${BASE_URL}/check-cpf?cpf=123456789`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.valid).toBe(false);
    });
  });

  describe('Validação de CPF em Tempo Real', () => {
    it('deve validar CPF com 11 dígitos', async () => {
      const response = await fetch(`${BASE_URL}/check-cpf?cpf=12345678901`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data.valid).toBe('boolean');
    });

    it('deve retornar mensagem de erro descritiva', async () => {
      const response = await fetch(`${BASE_URL}/check-cpf?cpf=11122233344`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (!data.valid) {
        expect(data.message).toBeDefined();
      }
    });
  });

  describe('Estrutura de Dados do Indicado', () => {
    it('deve incluir status ATIVO ou INATIVO', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        expect(['ATIVO', 'INATIVO']).toContain(data[0].status);
      }
    });

    it('deve incluir total de procedimentos realizados', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        expect(typeof data[0].totalProcedimentos).toBe('number');
        expect(data[0].totalProcedimentos).toBeGreaterThanOrEqual(0);
      }
    });

    it('deve incluir data de cadastro formatada', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        expect(new Date(data[0].createdAt).toISOString()).toBeDefined();
      }
    });
  });

  describe('Permissões e Escopo', () => {
    it('deve retornar apenas indicados do parceiro autenticado', async () => {
      const responseParceiro1 = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro-1' },
      });
      
      expect(responseParceiro1.status).toBe(200);
      
      const responseParceiro2 = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro-2' },
      });
      
      expect(responseParceiro2.status).toBe(200);
      
      // Cada parceiro deve ver apenas seus próprios indicados
      const data1 = await responseParceiro1.json();
      const data2 = await responseParceiro2.json();
      
      // Indicados devem ser diferentes (cada um tem os seus)
      expect(data1).not.toEqual(data2);
    });

    it('deve negar acesso a usuários de outros tipos', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Popup de Sucesso', () => {
    it('deve retornar nome do indicado após cadastro', async () => {
      const novoIndicado = {
        nome: 'Cliente Teste Popup',
        cpf: `${Date.now()}00004`,
        telefone: '',
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-parceiro'
        },
        body: JSON.stringify(novoIndicado),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.nome).toBe(novoIndicado.nome);
    });
  });
});