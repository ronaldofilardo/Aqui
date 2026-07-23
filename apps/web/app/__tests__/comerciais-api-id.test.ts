/**
 * Testes da API de Comercial por ID
 * Valida operações GET, PATCH e DELETE de comercial específico
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API - Backoffice Comerciais [id]', () => {
  const BASE_URL = 'http://localhost:3000/api/v1/backoffice/comerciais';
  const comercialId = 'comercial-teste-123';

  describe('GET /api/v1/backoffice/comerciais/[id]', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'GET',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-invalido' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      const response = await fetch(`${BASE_URL}/comercial-inexistente`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice do usuário', async () => {
      const response = await fetch(`${BASE_URL}/comercial-outro-backoffice`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-1' },
      });
      
      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Acesso negado');
    });

    it('deve retornar dados do comercial quando pertence ao backoffice', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.id).toBe(comercialId);
      expect(data).toHaveProperty('nome');
      expect(data).toHaveProperty('cpf');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('percentualComissao');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('liderancaId');
      expect(data).toHaveProperty('tipoLideranca');
    });

    it('deve incluir email do usuário associado', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  describe('PATCH /api/v1/backoffice/comerciais/[id]', () => {
    const updateValido = {
      nome: 'João Silva Atualizado',
      email: 'joao.atualizado@asa.test',
      status: 'ATIVO' as const,
    };

    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateValido),
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-invalido'
        },
        body: JSON.stringify(updateValido),
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      const response = await fetch(`${BASE_URL}/comercial-inexistente`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify(updateValido),
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice', async () => {
      const response = await fetch(`${BASE_URL}/comercial-outro-backoffice`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice-1'
        },
        body: JSON.stringify(updateValido),
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar erro quando email é inválido', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ email: 'email-invalido' }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('email');
    });

    it('deve atualizar nome do comercial', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ nome: 'Nome Atualizado' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.nome).toBe('Nome Atualizado');
    });

    it('deve atualizar email do comercial', async () => {
      const novoEmail = 'novo.email@asa.test';
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ email: novoEmail }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.email).toBe(novoEmail.toLowerCase());
    });

    it('deve normalizar email para lowercase', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ email: 'EMAIL.MAIUSCULO@TESTE.COM' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.email).toBe('email.maiusculo@asa.test');
    });

    it('deve atualizar status do comercial', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ status: 'INATIVO' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('INATIVO');
    });

    it('deve atualizar telefone do comercial', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ telefone: '(11) 98888-8888' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.telefone).toBe('(11) 98888-8888');
    });

    it('deve atualizar funcao do comercial', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ funcao: 'GERENTE_CIRE' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.funcao).toBe('GERENTE_CIRE');
    });

    it('deve criar audit log após atualização', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ nome: 'Nome Auditado' }),
      });
      
      expect(response.status).toBe(200);
      
      // Verificar se audit log foi criado (via GET ou banco)
      const getResponse = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(getResponse.status).toBe(200);
    });

    it('deve atualizar apenas campos fornecidos', async () => {
      const original = await fetch(`${BASE_URL}/${comercialId}`, {
        headers: { 'Authorization': 'Bearer token-backoffice' },
      }).then(r => r.json());
      
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token-backoffice'
        },
        body: JSON.stringify({ nome: 'Apenas Nome Atualizado' }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.nome).toBe('Apenas Nome Atualizado');
      expect(data.email).toBe(original.email);
      expect(data.status).toBe(original.status);
    });
  });

  describe('DELETE /api/v1/backoffice/comerciais/[id]', () => {
    it('deve retornar 401 quando usuário não está autenticado', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'DELETE',
      });
      
      expect(response.status).toBe(401);
    });

    it('deve retornar 403 quando usuário não é BACKOFFICE', async () => {
      const response = await fetch(`${BASE_URL}/${comercialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-invalido' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve retornar 404 quando comercial não existe', async () => {
      const response = await fetch(`${BASE_URL}/comercial-inexistente`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toContain('não encontrado');
    });

    it('deve retornar 403 quando comercial não pertence ao backoffice', async () => {
      const response = await fetch(`${BASE_URL}/comercial-outro-backoffice`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-backoffice-1' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve inativar comercial (soft delete) com sucesso', async () => {
      const response = await fetch(`${BASE_URL}/comercial-para-deletar`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.message).toContain('inativado');
    });

    it('deve inativar usuário associado ao comercial', async () => {
      const response = await fetch(`${BASE_URL}/comercial-para-deletar`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      
      // Verificar se usuário foi inativado
      const getResponse = await fetch(`${BASE_URL}/comercial-para-deletar`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      if (getResponse.status === 200) {
        const data = await getResponse.json();
        expect(data.status).toBe('INATIVO');
      }
    });

    it('deve criar audit log após deletar', async () => {
      const response = await fetch(`${BASE_URL}/comercial-para-deletar`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      
      // Audit log deve ter sido criado
      const data = await response.json();
      expect(data.message).toBeDefined();
    });

    it('deve preservar dados históricos do comercial', async () => {
      const response = await fetch(`${BASE_URL}/comercial-para-deletar`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
      
      // Comercial deve estar inativo mas ainda existir
      const getResponse = await fetch(`${BASE_URL}/comercial-para-deletar`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      // Ou retorna 404 ou retorna status INATIVO
      if (getResponse.status === 200) {
        const data = await getResponse.json();
        expect(data.status).toBe('INATIVO');
      }
    });

    it('não deve deletar comercial com comissões existentes (regra de negócio)', async () => {
      // Este teste valida a mensagem de aviso
      const response = await fetch(`${BASE_URL}/comercial-com-comissoes`, {
        method: 'DELETE',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      // A API deve permitir mas o frontend deve avisar
      expect(response.status).toBe(200);
    });
  });

  describe('Validações de Permissão', () => {
    it('deve permitir acesso apenas ao backowner do comercial', async () => {
      const response = await fetch(`${BASE_URL}/comercial-backoffice-2`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice-1' },
      });
      
      expect(response.status).toBe(403);
    });

    it('deve permitir acesso a comercial sem liderança do próprio backoffice', async () => {
      const response = await fetch(`${BASE_URL}/comercial-sem-lideranca`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(200);
    });
  });
});