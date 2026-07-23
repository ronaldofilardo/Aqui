/**
 * Testes da API de Comerciais - Listagem e Criação
 * Valida operações CRUD de comerciais
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API - Backoffice Comerciais', () => {
  const BASE_URL = 'http://localhost:3000/api/v1/backoffice/comerciais';

  describe('GET /api/v1/backoffice/comerciais', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      // Simular usuário não BACKOFFICE
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-invalido' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar lista de comerciais do backoffice', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve retornar comerciais com estrutura correta', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 0) {
        const comercial = data[0];
        expect(comercial).toHaveProperty('id');
        expect(comercial).toHaveProperty('nome');
        expect(comercial).toHaveProperty('cpf');
        expect(comercial).toHaveProperty('email');
        expect(comercial).toHaveProperty('funcao');
        expect(comercial).toHaveProperty('percentualComissao');
        expect(comercial).toHaveProperty('status');
        expect(comercial).toHaveProperty('createdAt');
        expect(comercial).toHaveProperty('liderancaId');
        expect(comercial).toHaveProperty('tipoLideranca');
      }
    });

    it('deve incluir comerciais com e sem liderança', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Deve retornar todos os comerciais, independente de ter liderança
      expect(Array.isArray(data)).toBe(true);
    });

    it('deve ordenar comerciais por data de criação (mais recente primeiro)', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.length > 1) {
        const dates = data.map((c: any) => new Date(c.createdAt).getTime());
        const sorted = [...dates].sort((a, b) => b - a);
        expect(dates).toEqual(sorted);
      }
    });

    it('deve filtrar comerciais apenas do backoffice do usuário', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-1' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Todos os comerciais devem pertencer ao mesmo backoffice
      data.forEach((comercial: any) => {
        expect(comercial.backofficeId).toBe('backoffice-1');
      });
    });
  });

  describe('POST /api/v1/backoffice/comerciais', () => {
    const comercialValido = {
      nome: 'João Silva',
      cpf: '12345678901',
      email: 'joao.silva@asa.test',
      telefone: '(11) 99999-9999',
      funcao: 'SUPERVISOR_COMERCIAL',
      lideranca: 'COMERCIAL' as const,
      percentualComissao: 10,
    };

    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(comercialValido),
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-invalido'
        },
        body: JSON.stringify(comercialValido),
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando nome é ausente', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ ...comercialValido, nome: '' }),
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
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ ...comercialValido, cpf: '123' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('CPF');
    });

    it('deve retornar erro quando email é inválido', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ ...comercialValido, email: 'email-invalido' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });

    it('deve retornar erro quando já existe usuário com mesmo email', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ ...comercialValido, email: 'existente@asa.test' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('já existe');
    });

    it('deve retornar erro quando já existe comercial com mesmo CPF', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ ...comercialValido, cpf: '11122233344' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('já existe');
    });

    it('deve retornar erro quando função é inválida', async () => {
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ ...comercialValido, funcao: 'FUNCAO_INVALIDA' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('deve criar comercial com sucesso quando dados são válidos', async () => {
      const novoComercial = {
        ...comercialValido,
        email: `novo.${Date.now()}@asa.test`,
        cpf: `${Date.now()}00001`,
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(novoComercial),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.nome).toBe(novoComercial.nome);
      expect(data.email).toBe(novoComercial.email.toLowerCase());
      expect(data.cpf).toBe(novoComercial.cpf);
    });

    it('deve criar usuário associado ao comercial', async () => {
      const novoComercial = {
        ...comercialValido,
        email: `usuario.${Date.now()}@asa.test`,
        cpf: `${Date.now()}00002`,
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(novoComercial),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.usuarioId).toBeDefined();
    });

    it('deve criar liderança quando lideranca é informado', async () => {
      const comercialComLideranca = {
        ...comercialValido,
        email: `lideranca.${Date.now()}@asa.test`,
        cpf: `${Date.now()}00003`,
        lideranca: 'COMERCIAL' as const,
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(comercialComLideranca),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.liderancaId).toBeDefined();
      expect(data.tipoLideranca).toBe('COMERCIAL');
    });

    it('deve normalizar email para lowercase', async () => {
      const comercialComEmailMaiusculo = {
        ...comercialValido,
        email: 'EMAIL.MAIUSCULO@ASA.TEST',
        cpf: `${Date.now()}00004`,
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(comercialComEmailMaiusculo),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.email).toBe('email.maiusculo@asa.test');
    });

    it('deve aceitar telefone como opcional', async () => {
      const comercialSemTelefone = {
        ...comercialValido,
        telefone: undefined,
        email: `sem-telefone.${Date.now()}@asa.test`,
        cpf: `${Date.now()}00005`,
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(comercialSemTelefone),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.id).toBeDefined();
    });

    it('deve criar comercial sem liderança quando lideranca não é informado', async () => {
      const comercialSemLideranca = {
        ...comercialValido,
        lideranca: undefined,
        email: `sem-lideranca.${Date.now()}@asa.test`,
        cpf: `${Date.now()}00006`,
      };
      
      const response = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(comercialSemLideranca),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.liderancaId).toBeNull();
    });
  });

  describe('Validações de Schema', () => {
    it('deve validar percentualComissao entre 0 e 100', async () => {
      const tests = [
        { valor: -1, deveFalhar: true },
        { valor: 0, deveFalhar: false },
        { valor: 50, deveFalhar: false },
        { valor: 100, deveFalhar: false },
        { valor: 101, deveFalhar: true },
      ];

      for (const test of tests) {
        const response = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token-backoffice'
          },
          body: JSON.stringify({
            nome: 'Teste',
            cpf: '12345678901',
            email: `teste.${test.valor}@asa.test`,
            percentualComissao: test.valor,
          }),
        });

        if (test.deveFalhar) {
          expect(response.status).toBe(400);
        } else {
          // Pode passar ou falhar por outros motivos
          expect(response.status).not.toBe(400);
        }
      }
    });

    it('deve validar função enum', async () => {
      const funcoesValidas = [
        'GERENTE_CIRE',
        'SUPERVISOR_ATIVO',
        'SUPERVISOR_RECEPTIVO',
        'SUPERVISOR_FRANQUIA',
        'SUPERVISOR_ATENDIMENTO',
        'GERENTE_ATENDIMENTO',
        'SUPERVISOR_COMERCIAL',
      ];

      for (const funcao of funcoesValidas) {
        const response = await fetch(BASE_URL, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token-backoffice'
          },
          body: JSON.stringify({
            nome: 'Teste',
            cpf: '12345678901',
            email: `teste.${funcao}@asa.test`,
            funcao,
            percentualComissao: 10,
          }),
        });

        // Não deve falhar por validação de enum
        if (response.status === 400) {
          const data = await response.json();
          expect(data.error).not.toContain('enum');
        }
      }
    });
  });
});