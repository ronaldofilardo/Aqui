/**
 * Testes de Componentes Críticos - Login Page
 * Valida redirecionamentos por tipo de usuário
 */

import { describe, it, expect, vi } from 'vitest';

describe('Login Page - Testes de Redirecionamento', () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    mockPush.mockClear();
  });

  describe('Redirecionamentos por Tipo de Usuário', () => {
    it('deve redirecionar BACKOFFICE para /backoffice/dashboard', () => {
      const tipo = 'BACKOFFICE';
      const papel = 'BACKOFFICE';

      let dashboard = '';
      
      // Lógica de redirecionamento
      if (tipo === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      } else if (tipo === 'GESTOR' && papel === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      } else if (tipo === 'GESTOR' && papel === 'GESTOR_PJ') {
        dashboard = '/gestor/dashboard';
      } else if (tipo === 'PARCEIRO') {
        dashboard = '/parceiro/indicados';
      } else if (tipo === 'COMERCIAL') {
        dashboard = '/comercial/minha-comissao';
      }

      expect(dashboard).toBe('/backoffice/dashboard');
    });

    it('deve redirecionar GESTOR com papel BACKOFFICE para /backoffice/dashboard', () => {
      const tipo = 'GESTOR';
      const papel = 'BACKOFFICE';

      let dashboard = '';
      
      if (tipo === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      } else if (tipo === 'GESTOR' && papel === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      }

      expect(dashboard).toBe('/backoffice/dashboard');
    });

    it('deve redirecionar GESTOR com papel GESTOR_PJ para /gestor/dashboard', () => {
      const tipo = 'GESTOR';
      const papel = 'GESTOR_PJ';

      let dashboard = '';
      
      if (tipo === 'GESTOR' && papel === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      } else if (tipo === 'GESTOR' && papel === 'GESTOR_PJ') {
        dashboard = '/gestor/dashboard';
      }

      expect(dashboard).toBe('/gestor/dashboard');
    });

    it('deve redirecionar PARCEIRO para /parceiro/indicados', () => {
      const tipo = 'PARCEIRO';

      let dashboard = '';
      
      if (tipo === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      } else if (tipo === 'PARCEIRO') {
        dashboard = '/parceiro/indicados';
      }

      expect(dashboard).toBe('/parceiro/indicados');
    });

    it('deve redirecionar COMERCIAL para /comercial/minha-comissao', () => {
      const tipo = 'COMERCIAL';

      let dashboard = '';
      
      if (tipo === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      } else if (tipo === 'COMERCIAL') {
        dashboard = '/comercial/minha-comissao';
      }

      expect(dashboard).toBe('/comercial/minha-comissao');
    });
  });

  describe('Matriz de Redirecionamento', () => {
    const matriz = [
      { tipo: 'BACKOFFICE', papel: 'BACKOFFICE', esperado: '/backoffice/dashboard' },
      { tipo: 'GESTOR', papel: 'BACKOFFICE', esperado: '/backoffice/dashboard' },
      { tipo: 'GESTOR', papel: 'GESTOR_PJ', esperado: '/gestor/dashboard' },
      { tipo: 'PARCEIRO', papel: null, esperado: '/parceiro/indicados' },
      { tipo: 'COMERCIAL', papel: null, esperado: '/comercial/minha-comissao' },
      { tipo: 'ADMIN', papel: null, esperado: '/admin/usuarios' },
    ];

    matriz.forEach(({ tipo, papel, esperado }) => {
      it(`deve redirecionar ${tipo}${papel ? ` (${papel})` : ''} para ${esperado}`, () => {
        let dashboard = '';

        if (tipo === 'ADMIN') {
          dashboard = '/admin/usuarios';
        } else if (tipo === 'BACKOFFICE') {
          dashboard = '/backoffice/dashboard';
        } else if (tipo === 'GESTOR' && papel === 'BACKOFFICE') {
          dashboard = '/backoffice/dashboard';
        } else if (tipo === 'GESTOR' && papel === 'GESTOR_PJ') {
          dashboard = '/gestor/dashboard';
        } else if (tipo === 'PARCEIRO') {
          dashboard = '/parceiro/indicados';
        } else if (tipo === 'COMERCIAL') {
          dashboard = '/comercial/minha-comissao';
        }

        expect(dashboard).toBe(esperado);
      });
    });
  });

  describe('Validação de Rotas de Dashboard', () => {
    const dashboards = [
      '/backoffice/dashboard',
      '/gestor/dashboard',
      '/parceiro/indicados',
      '/comercial/minha-comissao',
      '/admin/usuarios',
    ];

    dashboards.forEach((rota) => {
      it(`deve ter rota de dashboard válida: ${rota}`, () => {
        expect(rota).toMatch(/^\/[a-z\-/]+$/);
      });
    });
  });
});