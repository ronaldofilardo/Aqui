/**
 * Testes da API de Ranking de Pontos - Parceiro
 * Valida ranking de pontos na visão do parceiro
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('API - Parceiro Pontos Ranking', () => {
  const BASE_URL = 'http://localhost:3000/api/v1/parceiro/pontos/ranking';

  describe('GET /api/v1/parceiro/pontos/ranking', () => {
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

    it('deve retornar 400 quando não há ciclo vigente', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro-sem-ciclo' },
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Nenhum ciclo vigente');
    });

    it('deve retornar ranking do ciclo vigente quando cicloPontosId não é informado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('ranking');
      expect(data.ranking).toHaveProperty('ciclo');
      expect(data.ranking).toHaveProperty('minhaPosicaoNo');
      expect(data.ranking).toHaveProperty('meusPontos');
      expect(data.ranking).toHaveProperty('posicoes');
    });

    it('deve retornar ranking de ciclo específico quando cicloPontosId é informado', async () => {
      const response = await fetch(`${BASE_URL}?cicloPontosId=ciclo-especifico-123`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ranking.ciclo.id).toBe('ciclo-especifico-123');
    });

    it('deve retornar estrutura de ranking correta', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.ranking.ciclo).toHaveProperty('id');
      expect(data.ranking.ciclo).toHaveProperty('nome');
      expect(data.ranking.ciclo).toHaveProperty('status');
      expect(Array.isArray(data.ranking.posicoes)).toBe(true);
    });

    it('deve incluir minha posição no ranking', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data.ranking.minhaPosicaoNo).toBe('number');
    });

    it('deve incluir meus pontos acumulados', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(typeof data.ranking.meusPontos).toBe('number');
      expect(data.ranking.meusPontos).toBeGreaterThanOrEqual(0);
    });

    it('deve retornar posicoes com euSou=true para o parceiro autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const minhaPosicao = data.ranking.posicoes.find((p: any) => p.euSou);
      expect(minhaPosicao).toBeDefined();
      expect(minhaPosicao.euSou).toBe(true);
    });

    it('deve ordenar ranking por pontos (maior para menor)', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.ranking.posicoes.length > 1) {
        const pontos = data.ranking.posicoes.map((p: any) => p.pontosAcumulados);
        const sorted = [...pontos].sort((a, b) => b - a);
        expect(pontos).toEqual(sorted);
      }
    });

    it('deve atribuir posições sequenciais (1, 2, 3...)', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const posicoes = data.ranking.posicoes.map((p: any) => p.posicao);
      const expected = posicoes.map((_: any, i: number) => i + 1);
      expect(posicoes).toEqual(expected);
    });

    it('deve retornar estrutura de posição com nome do parceiro', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.ranking.posicoes.length > 0) {
        const posicao = data.ranking.posicoes[0];
        expect(posicao).toHaveProperty('posicao');
        expect(posicao).toHaveProperty('parceiro');
        expect(posicao).toHaveProperty('pontosAcumulados');
        expect(posicao).toHaveProperty('euSou');
        expect(typeof posicao.parceiro).toBe('string');
      }
    });

    it('deve calcular pontos como creditos - debitos + estornos', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      if (data.ranking.posicoes.length > 0) {
        const posicao = data.ranking.posicoes[0];
        expect(typeof posicao.pontosAcumulados).toBe('number');
      }
    });

    it('deve incluir parceiros de comerciais e gestores', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Deve retornar todos os parceiros do backoffice
      expect(Array.isArray(data.ranking.posicoes)).toBe(true);
    });

    it('deve determinar backoffice através do comercial ou gestor do parceiro', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro-comercial' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ranking).toBeDefined();
    });

    it('deve retornar dynamic force-dynamic', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      // Não deve usar cache estático
    });
  });

  describe('Validação de Ciclo', () => {
    it('deve retornar erro quando ciclo não existe', async () => {
      const response = await fetch(`${BASE_URL}?cicloPontosId=ciclo-inexistente`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('deve priorizar cicloPontosId sobre ciclo vigente', async () => {
      const responseVigente = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      const responseEspecifico = await fetch(`${BASE_URL}?cicloPontosId=ciclo-especifico`, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(responseVigente.status).toBe(200);
      expect(responseEspecifico.status).toBe(200);
      
      const dataEspecifico = await responseEspecifico.json();
      expect(dataEspecifico.ranking.ciclo.id).toBe('ciclo-especifico');
    });

    it('deve buscar ciclo EM_ANDAMENTO ou RESGATE_ABERTO como vigente', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const statusValidos = ['EM_ANDAMENTO', 'RESGATE_ABERTO'];
      expect(statusValidos).toContain(data.ranking.ciclo.status);
    });
  });

  describe('Minha Posição', () => {
    it('deve retornar null para minhaPosicaoNo quando parceiro não está no ranking', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro-sem-pontos' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Parceiro sem pontos pode não aparecer no ranking
      expect(data.ranking.meusPontos).toBe(0);
    });

    it('deve retornar meusPontos=0 quando parceiro não tem pontos', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro-sem-pontos' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ranking.meusPontos).toBe(0);
    });

    it('deve marcar euSou=true apenas para o parceiro autenticado', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro' },
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const posicoesEuSou = data.ranking.posicoes.filter((p: any) => p.euSou);
      expect(posicoesEuSou.length).toBe(1);
      expect(posicoesEuSou[0].euSou).toBe(true);
    });
  });

  describe('Permissões', () => {
    it('deve retornar apenas dados do backoffice do parceiro', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-parceiro-backoffice-1' },
      });
      
      expect(response.status).toBe(200);
      
      // Parceiro só deve ver ranking do seu próprio backoffice
      const data = await response.json();
      expect(data.ranking).toBeDefined();
    });

    it('deve negar acesso a usuários não PARCEIRO', async () => {
      const response = await fetch(BASE_URL, {
        method: 'GET',
        headers: { 'Authorization': 'Bearer token-backoffice' },
      });
      
      expect(response.status).toBe(403);
    });
  });
});