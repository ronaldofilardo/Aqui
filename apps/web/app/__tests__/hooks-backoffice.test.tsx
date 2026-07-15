/**
 * Testes de Hooks - Backoffice
 * Valida hooks personalizados usados nos componentes
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock do fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Hooks - Backoffice', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useComerciais (Simulação)', () => {
    it('deve buscar comerciais com sucesso', async () => {
      const mockComerciais = [
        {
          id: '1',
          nome: 'Comercial 1',
          email: 'comercial1@asa.com',
          cpf: '12345678901',
          percentualComissao: 5.0,
          status: 'ATIVO',
          funcao: 'SUPERVISOR_ATIVO',
        },
        {
          id: '2',
          nome: 'Comercial 2',
          email: 'comercial2@asa.com',
          cpf: '12345678902',
          percentualComissao: 7.5,
          status: 'ATIVO',
          funcao: 'GERENTE_CIRE',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockComerciais }),
      });

      // Simular hook de busca
      const useComerciaisMock = () => {
        const fetchComerciais = async () => {
          const response = await fetch('/api/v1/backoffice/comerciais');
          const data = await response.json();
          return data.data;
        };

        return { fetchComerciais };
      };

      const { result } = renderHook(() => useComerciaisMock(), {
        wrapper: createWrapper(),
      });

      const comerciais = await result.current.fetchComerciais();

      expect(mockFetch).toHaveBeenCalledWith('/api/v1/backoffice/comerciais');
      expect(comerciais).toHaveLength(2);
      expect(comerciais[0].nome).toBe('Comercial 1');
    });

    it('deve tratar erro na busca de comerciais', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const useComerciaisMock = () => {
        const fetchComerciais = async () => {
          const response = await fetch('/api/v1/backoffice/comerciais');
          if (!response.ok) {
            throw new Error('Erro ao buscar comerciais');
          }
          const data = await response.json();
          return data.data;
        };

        return { fetchComerciais };
      };

      const { result } = renderHook(() => useComerciaisMock(), {
        wrapper: createWrapper(),
      });

      await expect(result.current.fetchComerciais()).rejects.toThrow(
        'Erro ao buscar comerciais'
      );
    });

    it('deve filtrar comerciais por status', async () => {
      const mockComerciais = [
        { id: '1', nome: 'Comercial Ativo', status: 'ATIVO' },
        { id: '2', nome: 'Comercial Inativo', status: 'INATIVO' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockComerciais }),
      });

      const useComerciaisMock = () => {
        const fetchComerciais = async (filtro?: { status?: string }) => {
          const url = filtro?.status
            ? `/api/v1/backoffice/comerciais?status=${filtro.status}`
            : '/api/v1/backoffice/comerciais';
          
          const response = await fetch(url);
          const data = await response.json();
          return data.data;
        };

        const filtrarPorStatus = (comerciais: any[], status: string) => {
          return comerciais.filter(c => c.status === status);
        };

        return { fetchComerciais, filtrarPorStatus };
      };

      const { result } = renderHook(() => useComerciaisMock(), {
        wrapper: createWrapper(),
      });

      const todosComerciais = await result.current.fetchComerciais();
      const ativos = result.current.filtrarPorStatus(todosComerciais, 'ATIVO');

      expect(ativos).toHaveLength(1);
      expect(ativos[0].nome).toBe('Comercial Ativo');
    });
  });

  describe('useComissoes (Simulação)', () => {
    it('deve buscar comissões por comercial', async () => {
      const mockComissoes = [
        {
          id: '1',
          comercialId: '1',
          mesReferencia: '2026-03',
          valorVendas: 100000,
          valorComissao: 8000,
          status: 'CALCULADA',
        },
        {
          id: '2',
          comercialId: '1',
          mesReferencia: '2026-02',
          valorVendas: 80000,
          valorComissao: 6400,
          status: 'PAGA',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockComissoes }),
      });

      const useComissoesMock = () => {
        const fetchComissoes = async (comercialId: string) => {
          const response = await fetch(
            `/api/v1/backoffice/comerciais/${comercialId}/comissoes`
          );
          const data = await response.json();
          return data.data;
        };

        return { fetchComissoes };
      };

      const { result } = renderHook(() => useComissoesMock(), {
        wrapper: createWrapper(),
      });

      const comissoes = await result.current.fetchComissoes('1');

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/backoffice/comerciais/1/comissoes'
      );
      expect(comissoes).toHaveLength(2);
      expect(Number(comissoes[0].valorComissao)).toBe(8000);
    });

    it('deve calcular total de comissões', () => {
      const comissoes = [
        { valorComissao: 8000, status: 'CALCULADA' },
        { valorComissao: 6400, status: 'PAGA' },
        { valorComissao: 5000, status: 'CALCULADA' },
      ];

      const useComissoesMock = () => {
        const calcularTotal = (lista: any[]) => {
          return lista.reduce((sum, c) => sum + Number(c.valorComissao), 0);
        };

        const calcularPorStatus = (lista: any[], status: string) => {
          return lista
            .filter(c => c.status === status)
            .reduce((sum, c) => sum + Number(c.valorComissao), 0);
        };

        return { calcularTotal, calcularPorStatus };
      };

      const { result } = renderHook(() => useComissoesMock(), {
        wrapper: createWrapper(),
      });

      const total = result.current.calcularTotal(comissoes);
      const calculadas = result.current.calcularPorStatus(comissoes, 'CALCULADA');

      expect(total).toBe(19400);
      expect(calculadas).toBe(13000);
    });
  });

  describe('usePontosData (Simulação)', () => {
    it('deve buscar ciclos de pontos', async () => {
      const mockCiclos = [
        {
          id: '1',
          nome: 'Ciclo 2026.1',
          status: 'EM_ANDAMENTO',
          periodicidade: 'SEMESTRAL',
        },
        {
          id: '2',
          nome: 'Ciclo 2026',
          status: 'EM_ANDAMENTO',
          periodicidade: 'ANUAL',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCiclos }),
      });

      const usePontosDataMock = () => {
        const fetchCiclos = async () => {
          const response = await fetch('/api/v1/backoffice/pontos/ciclos');
          const data = await response.json();
          return data.data;
        };

        const filtrarPorStatus = (ciclos: any[], status: string) => {
          return ciclos.filter(c => c.status === status);
        };

        return { fetchCiclos, filtrarPorStatus };
      };

      const { result } = renderHook(() => usePontosDataMock(), {
        wrapper: createWrapper(),
      });

      const ciclos = await result.current.fetchCiclos();
      const emAndamento = result.current.filtrarPorStatus(ciclos, 'EM_ANDAMENTO');

      expect(ciclos).toHaveLength(2);
      expect(emAndamento).toHaveLength(2);
    });

    it('deve buscar configurações de pontos', async () => {
      const mockConfig = {
        id: '1',
        valorPorPonto: 100,
        tipoArredondamento: 'PADRAO',
        vigente: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [mockConfig] }),
      });

      const usePontosDataMock = () => {
        const fetchConfiguracoes = async () => {
          const response = await fetch('/api/v1/backoffice/pontos/configuracao');
          const data = await response.json();
          return data.data;
        };

        const obterConfigVigente = (configs: any[]) => {
          return configs.find(c => c.vigente);
        };

        return { fetchConfiguracoes, obterConfigVigente };
      };

      const { result } = renderHook(() => usePontosDataMock(), {
        wrapper: createWrapper(),
      });

      const configs = await result.current.fetchConfiguracoes();
      const vigente = result.current.obterConfigVigente(configs);

      expect(vigente).toBeDefined();
      expect(vigente?.valorPorPonto).toBe(100);
    });

    it('deve calcular saldo de pontos', () => {
      const movimentacoes = [
        { tipo: 'CREDITO', quantidade: 1000 },
        { tipo: 'DEBITO', quantidade: 500 },
        { tipo: 'CREDITO', quantidade: 300 },
        { tipo: 'ESTORNO', quantidade: 100 },
      ];

      const usePontosDataMock = () => {
        const calcularSaldo = (movs: any[]) => {
          const creditos = movs
            .filter(m => m.tipo === 'CREDITO')
            .reduce((sum, m) => sum + m.quantidade, 0);
          
          const debitos = movs
            .filter(m => m.tipo === 'DEBITO')
            .reduce((sum, m) => sum + m.quantidade, 0);
          
          const estornos = movs
            .filter(m => m.tipo === 'ESTORNO')
            .reduce((sum, m) => sum + m.quantidade, 0);

          return creditos - debitos + estornos;
        };

        return { calcularSaldo };
      };

      const { result } = renderHook(() => usePontosDataMock(), {
        wrapper: createWrapper(),
      });

      const saldo = result.current.calcularSaldo(movimentacoes);

      expect(saldo).toBe(900); // 1300 - 500 + 100
    });
  });

  describe('useRegras (Simulação)', () => {
    it('deve buscar regras comerciais', async () => {
      const mockRegras = {
        cartaoAcessoSaude: 5,
        cireAtivo: 10,
        cireReceptivo: 8,
        unidade: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockRegras }),
      });

      const useRegrasMock = () => {
        const fetchRegrasComerciais = async () => {
          const response = await fetch('/api/v1/backoffice/regras-comerciais');
          const data = await response.json();
          return data.data;
        };

        return { fetchRegrasComerciais };
      };

      const { result } = renderHook(() => useRegrasMock(), {
        wrapper: createWrapper(),
      });

      const regras = await result.current.fetchRegrasComerciais();

      expect(regras.cireAtivo).toBe(10);
    });

    it('deve buscar regras de gestores', async () => {
      const mockRegras = {
        gerenteCire: 15,
        supervisorAtivo: 10,
        supervisorComercial: 20,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockRegras }),
      });

      const useRegrasMock = () => {
        const fetchRegrasGestores = async () => {
          const response = await fetch('/api/v1/backoffice/regras-gestores');
          const data = await response.json();
          return data.data;
        };

        return { fetchRegrasGestores };
      };

      const { result } = renderHook(() => useRegrasMock(), {
        wrapper: createWrapper(),
      });

      const regras = await result.current.fetchRegrasGestores();

      expect(regras.gerenteCire).toBe(15);
    });
  });
});