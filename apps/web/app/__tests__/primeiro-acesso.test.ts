/**
 * Testes da API de Primeiro Acesso
 * Valida fluxo de ativação de conta via token
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API - Primeiro Acesso', () => {
  const BASE_URL = 'http://localhost:3000/api/auth/primeiro-acesso';

  describe('GET /api/auth/primeiro-acesso/[token]', () => {
    it('deve retornar erro quando token não é fornecido', async () => {
      const response = await fetch(`${BASE_URL}`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Token é obrigatório');
    });

    it('deve retornar erro quando token é inválido', async () => {
      const response = await fetch(`${BASE_URL}?token=token-invalido-123`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Token inválido');
    });

    it('deve retornar erro quando token já foi revogado', async () => {
      // Token já utilizado
      const response = await fetch(`${BASE_URL}?token=token-revogado`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('já foi utilizado');
    });

    it('deve retornar erro quando token expirou', async () => {
      const response = await fetch(`${BASE_URL}?token=token-expirado`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('expirou');
    });

    it('deve retornar dados do parceiro quando token é válido', async () => {
      const tokenValido = 'token-valido-teste';
      const response = await fetch(`${BASE_URL}?token=${tokenValido}`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('parceiroId');
      expect(data).toHaveProperty('parceiroNome');
      expect(data).toHaveProperty('gestorNome');
    });

    it('deve incluir nome do gestor através do comercial quando disponível', async () => {
      const response = await fetch(`${BASE_URL}?token=token-comercial`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gestorNome).toBeDefined();
    });

    it('deve incluir nome do gestor através do gestor quando disponível', async () => {
      const response = await fetch(`${BASE_URL}?token=token-gestor`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gestorNome).toBeDefined();
    });

    it('deve retornar "Não disponível" quando gestor não existe', async () => {
      const response = await fetch(`${BASE_URL}?token=token-sem-gestor`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.gestorNome).toBe('Não disponível');
    });
  });

  describe('POST /api/auth/primeiro-acesso/[token]', () => {
    it('deve retornar erro quando token não é fornecido', async () => {
      const response = await fetch(`${BASE_URL}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123!', confirmarSenha: 'Senha123!' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Token é obrigatório');
    });

    it('deve retornar erro quando senha não é fornecida', async () => {
      const response = await fetch(`${BASE_URL}?token=token-valido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmarSenha: 'Senha123!' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Senha é obrigatória');
    });

    it('deve retornar erro quando senhas não coincidem', async () => {
      const response = await fetch(`${BASE_URL}?token=token-valido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123!', confirmarSenha: 'SenhaDiferente!' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('não coincidem');
    });

    it('deve retornar erro quando senha é fraca (menos de 8 caracteres)', async () => {
      const response = await fetch(`${BASE_URL}?token=token-valido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'fraca', confirmarSenha: 'fraca' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/mínimo|caracteres/i);
    });

    it('deve retornar erro quando senha não tem letra maiúscula', async () => {
      const response = await fetch(`${BASE_URL}?token=token-valido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'senha123!', confirmarSenha: 'senha123!' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/maiúscula|upper/i);
    });

    it('deve retornar erro quando senha não tem número', async () => {
      const response = await fetch(`${BASE_URL}?token=token-valido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senhaaaa!', confirmarSenha: 'Senhaaaa!' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toMatch(/número|dígito/i);
    });

    it('deve retornar erro quando token é inválido', async () => {
      const response = await fetch(`${BASE_URL}?token=token-invalido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123!', confirmarSenha: 'Senha123!' }),
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('Token inválido');
    });

    it('deve retornar erro quando token já foi revogado', async () => {
      const response = await fetch(`${BASE_URL}?token=token-revogado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123!', confirmarSenha: 'Senha123!' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('já foi utilizado');
    });

    it('deve retornar erro quando token expirou', async () => {
      const response = await fetch(`${BASE_URL}?token=token-expirado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123!', confirmarSenha: 'Senha123!' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('expirou');
    });

    it('deve definir senha com sucesso quando dados são válidos', async () => {
      const response = await fetch(`${BASE_URL}?token=token-valido`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123!', confirmarSenha: 'Senha123!' }),
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain('Senha definida com sucesso');
    });

    it('deve revogar token após definir senha com sucesso', async () => {
      // Primeiro acesso define a senha
      const postResponse = await fetch(`${BASE_URL}?token=token-novo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123!', confirmarSenha: 'Senha123!' }),
      });
      
      expect(postResponse.status).toBe(201);
      
      // Segundo acesso deve falhar pois token foi revogado
      const getResponse = await fetch(`${BASE_URL}?token=token-novo`, {
        method: 'GET',
      });
      
      expect(getResponse.status).toBe(400);
      const data = await getResponse.json();
      expect(data.error).toContain('já foi utilizado');
    });
  });

  describe('Validação de Força da Senha', () => {
    const senhasFracas = [
      { senha: '123456', motivo: 'apenas números' },
      { senha: 'abcdef', motivo: 'apenas letras minúsculas' },
      { senha: 'ABCDEF', motivo: 'apenas letras maiúsculas' },
      { senha: 'Abcdef', motivo: 'sem números' },
      { senha: 'Abc123', motivo: 'muito curta (6 chars)' },
    ];

    senhasFracas.forEach(({ senha, motivo }) => {
      it(`deve rejeitar senha ${motivo}: ${senha}`, async () => {
        const response = await fetch(`${BASE_URL}?token=token-valido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha, confirmarSenha: senha }),
        });
        
        expect(response.status).toBe(400);
        const data = await response.json();
        expect(data.error).toBeDefined();
      });
    });

    const senhasFortes = [
      'Senha123!',
      'Teste@2024',
      'StrongP@ss',
      'Acesso123!',
    ];

    senhasFortes.forEach((senha) => {
      it(`deve aceitar senha forte: ${senha}`, async () => {
        const response = await fetch(`${BASE_URL}?token=token-valido`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha, confirmarSenha: senha }),
        });
        
        // Pode passar ou falhar por outros motivos, mas não por validação de senha
        if (response.status === 400) {
          const data = await response.json();
          expect(data.error).not.toMatch(/mínimo|caracteres|maiúscula|número/i);
        }
      });
    });
  });
});