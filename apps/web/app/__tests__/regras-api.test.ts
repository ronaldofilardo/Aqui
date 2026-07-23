/**
 * Testes das APIs de Regras - Comerciais e Gestores
 * Valida CRUD de regras de comissionamento
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API - Backoffice Regras Comerciais', () => {
  const BASE_URL = 'http://localhost:3000/api/v1/backoffice/regras-comerciais';

  describe('GET /api/v1/backoffice/regras-comerciais', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-invalido' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar regras do backoffice', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('cartaoAcessoSaude');
      expect(data).toHaveProperty('cireAtivo');
      expect(data).toHaveProperty('cireReceptivo');
      expect(data).toHaveProperty('franchisingAcesso');
      expect(data).toHaveProperty('franchisingCartao');
      expect(data).toHaveProperty('unidade');
    });

    it('deve retornar valores padrão quando não há regras cadastradas', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-sem-regras' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cartaoAcessoSaude).toBe(0);
      expect(data.cireAtivo).toBe(0);
      expect(data.cireReceptivo).toBe(0);
      expect(data.franchisingAcesso).toBe(0);
      expect(data.franchisingCartao).toBe(0);
      expect(data.unidade).toBe(0);
    });

    it('deve retornar valores numéricos como número', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(typeof data.cartaoAcessoSaude).toBe('number');
      expect(typeof data.cireAtivo).toBe('number');
      expect(typeof data.cireReceptivo).toBe('number');
      expect(typeof data.franchisingAcesso).toBe('number');
      expect(typeof data.franchisingCartao).toBe('number');
      expect(typeof data.unidade).toBe('number');
    });

    it('deve retornar ID da regra quando existe', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.id) {
        expect(typeof data.id).toBe('string');
      }
    });
  });

  describe('PUT /api/v1/backoffice/regras-comerciais', () => {
    const regrasValidas = {
      cartaoAcessoSaude: 10,
      cireAtivo: 15,
      cireReceptivo: 12,
      franchisingAcesso: 8,
      franchisingCartao: 5,
      unidade: 20,
    };

    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-invalido'
        },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando corpo é inválido', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ invalido: 'dados' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('inválido');
    });

    it('deve criar regras quando não existem', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice-novo'
        },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.cartaoAcessoSaude).toBe(10);
    });

    it('deve atualizar regras quando já existem', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({
          cartaoAcessoSaude: 25,
          cireAtivo: 30,
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cartaoAcessoSaude).toBe(25);
      expect(data.cireAtivo).toBe(30);
    });

    it('deve usar 0 como padrão para campos não informados', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ cartaoAcessoSaude: 15 }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cartaoAcessoSaude).toBe(15);
      expect(data.cireAtivo).toBe(0);
      expect(data.unidade).toBe(0);
    });

    it('deve retornar todos os campos após atualização', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('cartaoAcessoSaude');
      expect(data).toHaveProperty('cireAtivo');
      expect(data).toHaveProperty('cireReceptivo');
      expect(data).toHaveProperty('franchisingAcesso');
      expect(data).toHaveProperty('franchisingCartao');
      expect(data).toHaveProperty('unidade');
    });

    it('deve converter valores para número', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({
          cartaoAcessoSaude: '10',
          cireAtivo: '15',
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(typeof data.cartaoAcessoSaude).toBe('number');
      expect(data.cartaoAcessoSaude).toBe(10);
    });

    it('deve aceitar valores zerados', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({
          cartaoAcessoSaude: 0,
          cireAtivo: 0,
          cireReceptivo: 0,
          franchisingAcesso: 0,
          franchisingCartao: 0,
          unidade: 0,
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.cartaoAcessoSaude).toBe(0);
    });
  });

  describe('Validações de Regras', () => {
    it('deve aceitar apenas valores numéricos válidos', async () => {
      const tests = [
        { valor: -1, deveFalhar: false }, // Aceita negativos (regra de negócio)
        { valor: 0, deveFalhar: false },
        { valor: 100, deveFalhar: false },
        { valor: 1000, deveFalhar: false },
      ];

      for (const test of tests) {
        const response = await fetch(BASE_URL, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': 'Bearer token-backoffice'
          },
          body: JSON.stringify({ cartaoAcessoSaude: test.valor }),
        });

        if (test.deveFalhar) {
          expect(response.status).toBe(400);
        } else {
          expect(response.status).toBe(200);
        }
      }
    });
  });
});

describe('API - Backoffice Regras Gestores', () => {
  const BASE_URL = 'http://localhost:3000/api/v1/backoffice/regras-gestores';

  describe('GET /api/v1/backoffice/regras-gestores', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-invalido' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar regras de gestores do backoffice', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('gerenteCire');
      expect(data).toHaveProperty('supervisorAtivo');
      expect(data).toHaveProperty('supervisorReceptivo');
      expect(data).toHaveProperty('supervisorFranquia');
      expect(data).toHaveProperty('supervisorAtendimento');
      expect(data).toHaveProperty('gerenteAtendimento');
      expect(data).toHaveProperty('supervisorComercial');
    });

    it('deve retornar valores padrão quando não há regras cadastradas', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-sem-regras' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gerenteCire).toBe(0);
      expect(data.supervisorAtivo).toBe(0);
      expect(data.supervisorReceptivo).toBe(0);
      expect(data.supervisorFranquia).toBe(0);
      expect(data.supervisorAtendimento).toBe(0);
      expect(data.gerenteAtendimento).toBe(0);
      expect(data.supervisorComercial).toBe(0);
    });

    it('deve retornar valores numéricos como número', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(typeof data.gerenteCire).toBe('number');
      expect(typeof data.supervisorAtivo).toBe('number');
      expect(typeof data.supervisorReceptivo).toBe('number');
    });
  });

  describe('PUT /api/v1/backoffice/regras-gestores', () => {
    const regrasValidas = {
      gerenteCire: 10,
      supervisorAtivo: 15,
      supervisorReceptivo: 12,
      supervisorFranquia: 8,
      supervisorAtendimento: 5,
      gerenteAtendimento: 20,
      supervisorComercial: 18,
    };

    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-invalido'
        },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando corpo é inválido', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ invalido: 'dados' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('inválido');
    });

    it('deve criar regras quando não existem', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice-novo'
        },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBeDefined();
      expect(data.gerenteCire).toBe(10);
    });

    it('deve atualizar regras quando já existem', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({
          gerenteCire: 25,
          supervisorAtivo: 30,
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gerenteCire).toBe(25);
      expect(data.supervisorAtivo).toBe(30);
    });

    it('deve usar 0 como padrão para campos não informados', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ gerenteCire: 15 }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gerenteCire).toBe(15);
      expect(data.supervisorAtivo).toBe(0);
    });

    it('deve retornar todos os campos após atualização', async () => {
      const response = await fetch(BASE_URL, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(regrasValidas),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('gerenteCire');
      expect(data).toHaveProperty('supervisorAtivo');
      expect(data).toHaveProperty('supervisorReceptivo');
      expect(data).toHaveProperty('supervisorFranquia');
      expect(data).toHaveProperty('supervisorAtendimento');
      expect(data).toHaveProperty('gerenteAtendimento');
      expect(data).toHaveProperty('supervisorComercial');
    });
  });
});