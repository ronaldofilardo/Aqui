import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TabComerciais } from "../(dashboard)/backoffice/comissionamento/components/tab-comerciais";
import { useComerciais } from "../(dashboard)/backoffice/usuarios/comerciais/hooks/use-comerciais";

vi.mock("../(dashboard)/backoffice/usuarios/comerciais/hooks/use-comerciais");
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../(dashboard)/backoffice/usuarios/comerciais/components/novo-comercial-form", () => ({
  NovoComercialForm: () => <div data-testid="novo-comercial-form">Novo Comercial</div>,
}));

vi.mock("../(dashboard)/backoffice/usuarios/comerciais/components/comercial-modal", () => ({
  ComercialModal: () => <div data-testid="comercial-modal">Modal</div>,
}));

const mockComerciais = [
  {
    id: "comercial-1",
    nome: "João Silva",
    cpf: "123.456.789-00",
    email: "joao@teste.com",
    funcao: "GERENTE_CIRE",
    status: "ATIVO" as const,
  },
  {
    id: "comercial-2",
    nome: "Maria Santos",
    cpf: "987.654.321-00",
    email: "maria@teste.com",
    funcao: "SUPERVISOR_COMERCIAL",
    status: "ATIVO" as const,
  },
];

const mockMetas = [
  {
    id: "meta-1",
    comercialId: "comercial-1",
    mesReferencia: "2026-01",
    valorMeta: 1000,
    valorAtingido: 850,
  },
  {
    id: "meta-2",
    comercialId: "comercial-1",
    mesReferencia: "2026-02",
    valorMeta: 1200,
    valorAtingido: 0,
  },
];

describe("TabComerciais - Meta e Produção", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useComerciais as any).mockReturnValue({
      comerciais: mockComerciais,
      loading: false,
      refetch: vi.fn(),
      setComerciais: vi.fn(),
    });
  });

  it("deve renderizar tabela com duas linhas por comercial (Meta e Produção)", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetas,
    });

    render(<TabComerciais />);

    await waitFor(() => {
      expect(screen.getByText("Meta")).toBeInTheDocument();
      expect(screen.getByText("Produção")).toBeInTheDocument();
    });

    const metaLabels = screen.getAllByText("Meta");
    const producaoLabels = screen.getAllByText("Produção");

    expect(metaLabels).toHaveLength(mockComerciais.length);
    expect(producaoLabels).toHaveLength(mockComerciais.length);
  });

  it("deve exibir valores de meta formatados como moeda brasileira", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetas,
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("R$ 0,00");
      expect(inputs.length).toBeGreaterThan(0);
    });

    const inputsMeta = screen.getAllByPlaceholderText("R$ 0,00");
    const primeiroInputMeta = inputsMeta.find(
      (input) => (input as HTMLInputElement).value === "1.000,00"
    );
    expect(primeiroInputMeta).toBeInTheDocument();
  });

  it("deve exibir valores de produção formatados como moeda brasileira", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockMetas,
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("R$ 0,00");
      expect(inputs.length).toBeGreaterThan(0);
    });

    const inputsProducao = screen.getAllByPlaceholderText("R$ 0,00");
    const inputProducaoPreenchido = inputsProducao.find(
      (input) => (input as HTMLInputElement).value === "850,00"
    );
    expect(inputProducaoPreenchido).toBeInTheDocument();
  });

  it("deve formatar valor enquanto usuário digita", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("R$ 0,00");
      expect(inputs.length).toBeGreaterThan(0);
    });

    const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    const primeiroInput = inputs[0];

    fireEvent.change(primeiroInput, { target: { value: "123456" } });

    expect((primeiroInput as HTMLInputElement).value).toBe("1.234,56");
  });

  it("deve formatar valores com separador decimal correto", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    });

    const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    const input = inputs[0];

    fireEvent.change(input, { target: { value: "100000" } });
    expect((input as HTMLInputElement).value).toBe("1.000,00");

    fireEvent.change(input, { target: { value: "9999999" } });
    expect((input as HTMLInputElement).value).toBe("99.999,99");
  });

  it("deve ter colunas com largura adequada para 10 caracteres", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<TabComerciais />);

    await waitFor(() => {
      const table = container.querySelector("table");
      expect(table).toBeInTheDocument();
    });

    const table = container.querySelector("table");
    expect(table?.classList.contains("min-w-[1800px]")).toBe(true);
  });

  it("deve permitir scroll horizontal quando tabela excede largura da tela", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<TabComerciais />);

    await waitFor(() => {
      const scrollContainer = container.querySelector(".overflow-x-auto");
      expect(scrollContainer).toBeInTheDocument();
    });
  });

  it("deve mesclar colunas Comercial, Função e Ações nas duas linhas", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<TabComerciais />);

    await waitFor(() => {
      expect(screen.getByText("João Silva")).toBeInTheDocument();
    });

    const cellsWithRowSpan = container.querySelectorAll('[rowspan="2"]');
    expect(cellsWithRowSpan.length).toBeGreaterThanOrEqual(3);
  });

  it("deve ter input com font-mono para alinhamento de valores", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<TabComerciais />);

    await waitFor(() => {
      const inputs = container.querySelectorAll('input[placeholder="R$ 0,00"]');
      expect(inputs.length).toBeGreaterThan(0);
    });

    const inputs = container.querySelectorAll('input[placeholder="R$ 0,00"]');
    inputs.forEach((input) => {
      expect(input.classList.contains("font-mono")).toBe(true);
    });
  });

  it("deve ter input alinhado à direita para valores numéricos", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<TabComerciais />);

    await waitFor(() => {
      const inputs = container.querySelectorAll('input[placeholder="R$ 0,00"]');
    });

    const inputs = container.querySelectorAll('input[placeholder="R$ 0,00"]');
    inputs.forEach((input) => {
      expect(input.classList.contains("text-right")).toBe(true);
    });
  });

  it("deve diferenciar visualmente linha de Produção com fundo azulado", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<TabComerciais />);

    await waitFor(() => {
      const inputs = container.querySelectorAll('input[placeholder="R$ 0,00"]');
    });

    const inputsProducao = container.querySelectorAll(
      'input[placeholder="R$ 0,00"].bg-blue-50\\/40'
    );
    expect(inputsProducao.length).toBeGreaterThan(0);
  });

  it("deve ter 12 colunas de meses na tabela", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TabComerciais />);

    await waitFor(() => {
      expect(screen.getByText("Jan")).toBeInTheDocument();
    });

    const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    meses.forEach((mes) => {
      expect(screen.getByText(mes)).toBeInTheDocument();
    });
  });

  it("deve ter botão Salvar desabilitado quando não há alterações", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const botaoSalvar = screen.getByText("💾 Salvar (0)");
      expect(botaoSalvar).toBeDisabled();
    });
  });

  it("deve habilitar botão Salvar ao alterar valor de meta", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    });

    const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    fireEvent.change(inputs[0], { target: { value: "150000" } });

    await waitFor(() => {
      const botaoSalvar = screen.getByText("💾 Salvar (1)");
      expect(botaoSalvar).not.toBeDisabled();
    });
  });

  it("deve habilitar botão Salvar ao alterar valor de produção", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    });

    const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    const inputProducao = inputs[mockComerciais.length * 12];
    fireEvent.change(inputProducao, { target: { value: "75000" } });

    await waitFor(() => {
      const botaoSalvar = screen.getByText("💾 Salvar (1)");
      expect(botaoSalvar).not.toBeDisabled();
    });
  });

  it("deve contar alterações de meta e produção somadas", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<TabComerciais />);

    await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    });

    const inputs = screen.getAllByPlaceholderText("R$ 0,00");
    fireEvent.change(inputs[0], { target: { value: "100000" } });
    fireEvent.change(inputs[12], { target: { value: "80000" } });

    await waitFor(() => {
      const botaoSalvar = screen.getByText("💾 Salvar (2)");
      expect(botaoSalvar).not.toBeDisabled();
    });
  });
});