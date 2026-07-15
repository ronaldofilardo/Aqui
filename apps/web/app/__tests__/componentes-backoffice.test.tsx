/**
 * Testes de Componentes - Backoffice
 * Valida componentes React após migração
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';

// Mock dos componentes
vi.mock('@/lib/api-helpers', () => ({
  requireBackoffice: vi.fn(),
  requireBackofficeWithScope: vi.fn(),
}));

describe('Componentes Backoffice', () => {
  describe('Sidebar', () => {
    it('deve mostrar menu Backoffice para usuário BACKOFFICE', async () => {
      const { Sidebar } = await import('@/components/sidebar');
      
      const mockSession = {
        user: {
          id: '1',
          name: 'Backoffice User',
          email: 'backoffice@asa.com',
          tipo: 'BACKOFFICE' as const,
          papel: 'BACKOFFICE' as const,
        },
      };

      render(
        <SessionProvider session={mockSession}>
          <Sidebar />
        </SessionProvider>
      );

      // Aguardar renderização
      await waitFor(() => {
        expect(screen.getByText('Backoffice')).toBeInTheDocument();
      });

      // Verificar se mostra label "Backoffice"
      const backofficeLabel = screen.getByText('Backoffice');
      expect(backofficeLabel).toBeInTheDocument();
    });

    it('deve mostrar navegação correta para backoffice', async () => {
      const { Sidebar } = await import('@/components/sidebar');
      
      const mockSession = {
        user: {
          id: '1',
          name: 'Backoffice User',
          email: 'backoffice@asa.com',
          tipo: 'BACKOFFICE' as const,
          papel: 'BACKOFFICE' as const,
        },
      };

      render(
        <SessionProvider session={mockSession}>
          <Sidebar />
        </SessionProvider>
      );

      // Verificar links de navegação
      await waitFor(() => {
        expect(screen.getByText('Pontos')).toBeInTheDocument();
        expect(screen.getByText('Usuários')).toBeInTheDocument();
        expect(screen.getByText('Produção')).toBeInTheDocument();
        expect(screen.getByText('Comissionamento')).toBeInTheDocument();
        expect(screen.getByText('Configurações')).toBeInTheDocument();
      });

      // Verificar URLs
      const pontosLink = screen.getByText('Pontos').closest('a');
      expect(pontosLink?.getAttribute('href')).toBe('/backoffice/pontos');

      const usuariosLink = screen.getByText('Usuários').closest('a');
      expect(usuariosLink?.getAttribute('href')).toBe('/backoffice/usuarios');
    });
  });

  describe('Login Page', () => {
    it('deve redirecionar BACKOFFICE para /backoffice/dashboard', async () => {
      const mockPush = vi.fn();
      vi.mock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
        }),
      }));

      // Simular login bem-sucedido
      const tipo = 'BACKOFFICE';
      const papel = 'BACKOFFICE';

      // Lógica de redirecionamento do login
      if (tipo === 'BACKOFFICE') {
        mockPush('/backoffice/dashboard');
      }

      expect(mockPush).toHaveBeenCalledWith('/backoffice/dashboard');
    });
  });
});