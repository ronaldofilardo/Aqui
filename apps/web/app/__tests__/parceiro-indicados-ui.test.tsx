/**
 * Testes de Componentes de Indicados - Parceiro
 * Valida a interface de gestão de indicados
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ParceiroIndicados from '../(dashboard)/parceiro/indicados/page';

vi.mock('next-auth/react', () => ({
  useSession: () => ({ data: { user: { id: 'p1', tipo: 'PARCEIRO' } } }),
}));

describe('ParceiroIndicados Page', () => {
  it('deve renderizar o título e botão de cadastro', () => {
    render(<ParceiroIndicados />);
    expect(screen.getByText('Meus Clientes')).toBeInTheDocument();
    expect(screen.getByText('+ Cadastrar Cliente')).toBeInTheDocument();
  });

  it('deve abrir o modal de cadastro ao clicar no botão', () => {
    render(<ParceiroIndicados />);
    fireEvent.click(screen.getByText('+ Cadastrar Cliente'));
    expect(screen.getByText('Cadastrar Cliente')).toBeInTheDocument();
  });

  it('deve validar CPF em tempo real durante a digitação', async () => {
    render(<ParceiroIndicados />);
    fireEvent.click(screen.getByText('+ Cadastrar Cliente'));
    
    const cpfInput = screen.getByPlaceholderText('000.000.000-00');
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: false, message: 'CPF indisponível' }),
    });

    fireEvent.change(cpfInput, { target: { value: '12345678901' } });
    
    await waitFor(() => {
      expect(screen.getByText('CPF inválido ou não disponível')).toBeInTheDocument();
    });
  });

  it('deve mostrar popup de sucesso após cadastro', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => [] }) // fetchIndicados
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'ind1' }) }); // POST indicar

    render(<ParceiroIndicados />);
    fireEvent.click(screen.getByText('+ Cadastrar Cliente'));
    
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), { target: { value: 'Cliente Teste' } });
    fireEvent.change(screen.getByLabelText(/CPF/i), { target: { value: '12345678901' } });
    
    // Simular validação de CPF como válida para habilitar botão
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ valid: true }),
    });
    
    fireEvent.change(screen.getByLabelText(/CPF/i), { target: { value: '12345678901' } });
    
    await waitFor(() => {
      const submitBtn = screen.getByText('Cadastrar');
      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(screen.getByText('Cadastro Realizado com Sucesso!')).toBeInTheDocument();
    });
  });
});