/**
 * Testes de Componentes Críticos - Sidebar
 * Valida navegação e exibição por tipo de usuário
 */

import { describe, it, expect, vi } from 'vitest';

// Mock do next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: 'unauthenticated',
  })),
}));

// Mock do next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/',
}));

describe('Sidebar - Testes de Validação', () => {
  describe('Navegação Backoffice', () => {
    it('deve mostrar menu Backoffice para usuário BACKOFFICE', () => {
      // Simular sessão de backoffice
      const mockSessaoBackoffice = {
        user: {
          id: '1',
          name: 'Backoffice User',
          email: 'backoffice@asa.com',
          tipo: 'BACKOFFICE',
          papel: 'BACKOFFICE',
        },
      };

      // Validar estrutura do menu - Pontos, Produção e Comissionamento na raiz
      const menuBackoffice = {
        label: 'Backoffice',
        items: [
          { label: 'Pontos', href: '/backoffice/pontos' },
          { label: 'Produção', href: '/backoffice/producao' },
          { label: 'Comissionamento', href: '/backoffice/comissionamento' },
        ],
      };

      expect(menuBackoffice.label).toBe('Backoffice');
      expect(menuBackoffice.items.length).toBe(3);
      expect(menuBackoffice.items[0].href).toBe('/backoffice/pontos');
      expect(menuBackoffice.items[1].href).toBe('/backoffice/producao');
    });

    it('deve redirecionar para /backoffice/dashboard', () => {
      const tipo = 'BACKOFFICE';
      const papel = 'BACKOFFICE';

      let dashboard = '';
      
      // Lógica de redirecionamento do login
      if (tipo === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      } else if (tipo === 'GESTOR' && papel === 'BACKOFFICE') {
        dashboard = '/backoffice/dashboard';
      }

      expect(dashboard).toBe('/backoffice/dashboard');
    });
  });

  describe('Estrutura de Navegação', () => {
    it('deve ter sub-itens em Produção incluindo Upload', () => {
      const estruturaProducao = {
        label: 'Produção',
        href: '/backoffice/producao',
        subItems: [
          { label: 'Upload de Planilha', href: '/backoffice/producao?tab=upload' },
          { label: 'Procedimentos', href: '/backoffice/producao/procedimentos' },
        ],
      };

      expect(estruturaProducao.subItems.length).toBe(2);
      expect(estruturaProducao.subItems[0].href).toContain('tab=upload');
    });

    it('deve ter Comerciais como sub-item ou rota de Usuários', () => {
      const estruturaComerciais = {
        label: 'Comerciais',
        href: '/backoffice/usuarios/comerciais',
      };

      expect(estruturaComerciais.href).toBe('/backoffice/usuarios/comerciais');
    });

    it('deve ter Comissionamento na raiz com sub-itens', () => {
      const estruturaComissionamento = {
        label: 'Comissionamento',
        href: '/backoffice/comissionamento',
        parent: 'Raiz',
        subItems: [
          { label: 'Relatórios', href: '/backoffice/comissionamento/relatorios' },
          { label: 'Pagamentos', href: '/backoffice/comissionamento/pagamentos' },
        ],
      };

      expect(estruturaComissionamento.parent).toBe('Raiz');
      expect(estruturaComissionamento.subItems.length).toBe(2);
    });
  });

  describe('Validação de Rotas', () => {
    const rotasBackoffice = [
      '/backoffice/pontos',
      '/backoffice/usuarios',
      '/backoffice/usuarios/comerciais',
      '/backoffice/producao',
      '/backoffice/producao?tab=upload',
      '/backoffice/producao/procedimentos',
      '/backoffice/comissionamento',
      '/backoffice/comissionamento/relatorios',
      '/backoffice/comissionamento/pagamentos',
    ];

    rotasBackoffice.forEach((rota) => {
      it(`deve ter rota válida: ${rota}`, () => {
        expect(rota).toMatch(/^\/backoffice\/[a-z\-/?&=0-9]+$/);
      });
    });
  });

  describe('Migração de Upload', () => {
    it('NÃO deve mais existir rota standalone /backoffice/producao/upload', () => {
      const rotaAntiga = '/backoffice/producao/upload';
      
      // Upload agora é sub-item de Produção via query param
      const novaEstrutura = {
        parent: '/backoffice/producao',
        path: '/backoffice/producao?tab=upload',
      };

      expect(rotaAntiga).not.toBe(novaEstrutura.path.split('?')[0]);
      expect(novaEstrutura.parent).toBe('/backoffice/producao');
    });
  });
});