/**
 * Testes de Integração de UI - Backoffice Comerciais
 * Valida a interação entre a página de listagem e seus componentes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UsuariosComerciaisPage from '../(dashboard)/backoffice/usuarios/comerciais/page';

vi.mock('../(dashboard)/backoffice/usuarios/comerciais/hooks/use-comerciais', () => ({
  useComerciais: () => ({
    comerciais: [
      { id: '1', nome: 'Comercial Teste 1', cpf: '12345678901', email: 't1@teste.com', status: 'ATIVO', funcao: 'SUPERVISOR_COMERCIAL' },
      { id: '2', nome: 'Comercial Teste 2', cpf: '12345678902', email: 't2@teste.com', status: 'ATIVO', funcao: 'GERENTE_CIRE' },
    ],
    loading: false,
    refetch: vi.fn(),
    setComerciais: vi.fn(),
  }),
}));

vi.mock('../(dashboard)/backoffice/usuarios/comerciais/hooks/use-regras', () => ({
  useRegras: () => ({
    regrasComerciais: [],
    regrasGestores: [],
    loading: false,
    refetch: vi.fn(),
  }),
}));

describe('UsuariosComerciaisPage Integration', () => {
  it('deve renderizar a lista de comerciais', () => {
    render(<UsuariosComerciaisPage />);
    expect(screen.getByText('Comercial Teste 1')).toBeInTheDocument();
    expect(screen.getByText('Comercial Teste 2')).toBeInTheDocument();
  });

  it('deve abrir o modal de edição ao clicar em editar', async () => {
    render(<UsuariosComerciaisPage />);
    
    const editButtons = screen.getAllByText(/Editar/i);
    fireEvent.click(editButtons[0]);
    
    expect(screen.getByText('Editar Comercial')).toBeInTheDocument();
  });

  it('deve disparar confirmação ao tentar deletar', async () => {
    window.confirm = vi.fn().mockReturnValue(true);
    render(<UsuariosComerciaisPage />);
    
    const deleteButtons = screen.getAllByText(/Deletar/i);
    fireEvent.click(deleteButtons[0]);
    
    expect(window.confirm).toHaveBeenCalled();
  });

  it('deve permitir a edição de metas na tabela', async () => {
    render(<UsuariosComerciaisPage />);
    
    const inputs = screen.getAllByPlaceholderText('R$');
    fireEvent.change(inputs[0], { target: { value: '5000' } });
    fireEvent.blur(inputs[0]);
    
    // O onBlur dispara o handleSalvarMetaGeral que faz um fetch
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/backoffice/comerciais/1/metas'),
      expect.objectContaining({ method: 'POST' })
    );
  });
});