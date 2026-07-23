/**
 * Testes - Layout da Tabela de Metas dos Comerciais
 * Valida que as colunas "Comercial", "Função" e "Ações" estão fixas
 * e as colunas de meses (Jan-Dez) são visíveis sem scroll horizontal.
 *
 * Corrige problema onde colunas de metas passavam por baixo das colunas fixas
 * devido ao uso incorreto de sticky positioning com valores hardcoded.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TabComerciais } from '../(dashboard)/backoffice/comissionamento/components/tab-comerciais';

// Mock dos hooks e dependências
vi.mock('../(dashboard)/backoffice/usuarios/comerciais/hooks/use-comerciais', () => ({
  useComerciais: () => ({
    comerciais: [
      {
        id: '1',
        nome: 'Teste Comercial',
        cpf: '12345678901',
        email: 'teste@asa.com',
        funcao: 'GERENTE_CIRE',
        status: 'ATIVO',
        lideranca: 'COMERCIAL',
        percentualComissao: 5,
        createdAt: new Date(),
      },
    ],
    loading: false,
    refetch: vi.fn(),
    setComerciais: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../(dashboard)/backoffice/usuarios/comerciais/components/novo-comercial-form', () => ({
  NovoComercialForm: () => <div data-testid="novo-comercial-form">Novo Comercial</div>,
}));

vi.mock('../(dashboard)/backoffice/usuarios/comerciais/components/comercial-modal', () => ({
  ComercialModal: () => <div data-testid="comercial-modal">Modal</div>,
}));

describe('TabComerciais - Layout da Tabela de Metas', () => {
  it('deve renderizar tabela com colunas fixas e colunas de meses visíveis', () => {
    render(<TabComerciais />);

    // Verifica colunas fixas no header
    expect(screen.getByText('Comercial')).toBeInTheDocument();
    expect(screen.getByText('Função')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();

    // Verifica todos os 12 meses estão visíveis
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    meses.forEach((mes) => {
      expect(screen.getByText(mes)).toBeInTheDocument();
    });
  });

  it('deve renderizar tabela com classe table-fixed para layout correto', () => {
    const { container } = render(<TabComerciais />);
    const table = container.querySelector('table');
    expect(table).toHaveClass('table-fixed');
  });

  it('deve renderizar container com scroll apenas vertical', () => {
    const { container } = render(<TabComerciais />);
    const scrollContainer = container.querySelector('.overflow-y-auto');
    expect(scrollContainer).toHaveClass('overflow-x-hidden');
    expect(scrollContainer).not.toHaveClass('overflow-x-auto');
  });

  it('deve renderizar header sticky no topo', () => {
    const { container } = render(<TabComerciais />);
    const headerRow = container.querySelector('thead tr');
    expect(headerRow).toHaveClass('sticky', 'top-0');
  });

  it('deve renderizar colunas com larguras fixas corretas', () => {
    const { container } = render(<TabComerciais />);
    const headers = container.querySelectorAll('thead th');
    
    // Comercial: w-[150px]
    expect(headers[0]).toHaveClass('w-[150px]');
    
    // Função: w-[90px]
    expect(headers[1]).toHaveClass('w-[90px]');
    
    // Ações: w-[130px]
    expect(headers[2]).toHaveClass('w-[130px]');
  });

  it('não deve usar sticky positioning nas colunas da tabela', () => {
    const { container } = render(<TabComerciais />);
    const cells = container.querySelectorAll('td');
    
    cells.forEach((cell) => {
      expect(cell).not.toHaveClass('sticky');
      expect(cell).not.toHaveClass('left-0');
      expect(cell).not.toHaveClass('left-64');
      expect(cell).not.toHaveClass('left-[340px]');
    });
  });

  it('deve renderizar inputs de metas para cada mês', () => {
    render(<TabComerciais />);
    
    // Deve haver 12 inputs (um para cada mês)
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(12);
  });

  it('deve renderizar botões Editar e Deletar', () => {
    render(<TabComerciais />);
    
    expect(screen.getByText('Editar')).toBeInTheDocument();
    expect(screen.getByText('Deletar')).toBeInTheDocument();
  });
});