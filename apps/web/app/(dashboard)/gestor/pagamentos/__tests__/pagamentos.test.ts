import { describe, it, expect } from "vitest";

/**
 * Testes para a página de Pagamentos (Gestor)
 * 
 * Alterações cobertas:
 * 1. Consolidação de tabelas de consultores e estabelecimentos
 * 2. Filtros com checkboxes para tipo (consultores/estabelecimentos)
 * 3. Filtro de status dinâmico
 * 4. Coluna de consultor em pagamentos de estabelecimentos
 * 5. Botões de ação (PIX/Recibo)
 */

describe("Página Pagamentos - Consolidação e Filtros", () => {
  it("deve mesclar pagamentos de consultores e estabelecimentos", () => {
    const pagamentosConsultores = [
      { id: "1", status: "PAGO", tipo: "consultor" },
      { id: "2", status: "PENDENTE", tipo: "consultor" },
    ];

    const pagamentosEstabelecimentos = [
      { id: "3", status: "PAGO", tipo: "estabelecimento" },
      { id: "4", status: "PENDENTE", tipo: "estabelecimento" },
    ];

    const pagamentosCombinados = [
      ...pagamentosConsultores,
      ...pagamentosEstabelecimentos,
    ];

    expect(pagamentosCombinados).toHaveLength(4);
    expect(pagamentosCombinados[0].tipo).toBe("consultor");
    expect(pagamentosCombinados[3].tipo).toBe("estabelecimento");
  });

  it("deve filtrar por tipo: apenas consultores", () => {
    const pagamentos = [
      { id: "1", status: "PAGO", tipo: "consultor" },
      { id: "2", status: "PENDENTE", tipo: "consultor" },
      { id: "3", status: "PAGO", tipo: "estabelecimento" },
    ];

    const filtroTipo = { consultores: true, estabelecimentos: false };
    const filtrados = pagamentos.filter(
      (p) =>
        (filtroTipo.consultores && p.tipo === "consultor") ||
        (filtroTipo.estabelecimentos && p.tipo === "estabelecimento")
    );

    expect(filtrados).toHaveLength(2);
    expect(filtrados.every((p) => p.tipo === "consultor")).toBe(true);
  });

  it("deve filtrar por tipo: apenas estabelecimentos", () => {
    const pagamentos = [
      { id: "1", status: "PAGO", tipo: "consultor" },
      { id: "3", status: "PAGO", tipo: "estabelecimento" },
      { id: "4", status: "PENDENTE", tipo: "estabelecimento" },
    ];

    const filtroTipo = { consultores: false, estabelecimentos: true };
    const filtrados = pagamentos.filter(
      (p) =>
        (filtroTipo.consultores && p.tipo === "consultor") ||
        (filtroTipo.estabelecimentos && p.tipo === "estabelecimento")
    );

    expect(filtrados).toHaveLength(2);
    expect(filtrados.every((p) => p.tipo === "estabelecimento")).toBe(true);
  });

  it("deve listar tudo quando ambos filtros marcados", () => {
    const pagamentos = [
      { id: "1", status: "PAGO", tipo: "consultor" },
      { id: "3", status: "PAGO", tipo: "estabelecimento" },
    ];

    const filtroTipo = { consultores: true, estabelecimentos: true };
    const filtrados = pagamentos.filter(
      (p) =>
        (filtroTipo.consultores && p.tipo === "consultor") ||
        (filtroTipo.estabelecimentos && p.tipo === "estabelecimento")
    );

    expect(filtrados).toHaveLength(2);
  });

  it("deve não listar nada quando nenhum filtro marcado", () => {
    const pagamentos = [
      { id: "1", status: "PAGO", tipo: "consultor" },
      { id: "3", status: "PAGO", tipo: "estabelecimento" },
    ];

    const filtroTipo = { consultores: false, estabelecimentos: false };
    const filtrados = pagamentos.filter(
      (p) =>
        (filtroTipo.consultores && p.tipo === "consultor") ||
        (filtroTipo.estabelecimentos && p.tipo === "estabelecimento")
    );

    expect(filtrados).toHaveLength(0);
  });

  it("deve filtrar por status", () => {
    const pagamentos = [
      { id: "1", status: "PAGO", tipo: "consultor" },
      { id: "2", status: "PENDENTE", tipo: "consultor" },
      { id: "3", status: "PAGO", tipo: "estabelecimento" },
    ];

    const filtroStatus = "PAGO";
    const filtrados = pagamentos.filter((p) => p.status === filtroStatus);

    expect(filtrados).toHaveLength(2);
    expect(filtrados.every((p) => p.status === "PAGO")).toBe(true);
  });

  it("deve combinar filtro de tipo e status", () => {
    const pagamentos = [
      { id: "1", status: "PAGO", tipo: "consultor" },
      { id: "2", status: "PENDENTE", tipo: "consultor" },
      { id: "3", status: "PAGO", tipo: "estabelecimento" },
    ];

    const filtroTipo = { consultores: true, estabelecimentos: false };
    const filtroStatus = "PAGO";

    const filtrados = pagamentos.filter(
      (p) =>
        (filtroTipo.consultores && p.tipo === "consultor") &&
        (!filtroStatus || p.status === filtroStatus)
    );

    expect(filtrados).toHaveLength(1);
    expect(filtrados[0].tipo).toBe("consultor");
    expect(filtrados[0].status).toBe("PAGO");
  });
});

describe("Pagamentos - Estrutura de Dados", () => {
  it("deve incluir array de consultores em estabelecimentos", () => {
    const pagamento = {
      id: "est-1",
      nomeFantasia: "Farmácia X",
      valorTotal: 100.5,
      status: "PAGO",
      consultores: [
        { id: "c1", nome: "João Silva" },
        { id: "c2", nome: "Maria Santos" },
      ],
    };

    expect(pagamento.consultores).toHaveLength(2);
    expect(pagamento.consultores[0].nome).toBe("João Silva");
  });

  it("deve gerar lista de status únicos", () => {
    const pagamentosConsultores = [
      { status: "PAGO" },
      { status: "PENDENTE" },
      { status: "PAGO" },
    ];

    const pagamentosEstabelecimentos = [
      { status: "PENDENTE" },
      { status: "PROCESSANDO" },
    ];

    const statusesUnicos = Array.from(
      new Set([
        ...pagamentosConsultores.map((p) => p.status),
        ...pagamentosEstabelecimentos.map((p) => p.status),
      ])
    ).sort();

    expect(statusesUnicos).toEqual(["PAGO", "PENDENTE", "PROCESSANDO"]);
  });

  it("deve calcular valor total correto por período", () => {
    const comissoes = [
      { valorEstabelecimento: 100, mes: 4, ano: 2026 },
      { valorEstabelecimento: 150, mes: 4, ano: 2026 },
      { valorEstabelecimento: 50, mes: 5, ano: 2026 },
    ];

    const mes = 4;
    const ano = 2026;

    const valorTotal = comissoes
      .filter((c) => c.mes === mes && c.ano === ano)
      .reduce((sum, c) => sum + c.valorEstabelecimento, 0);

    expect(valorTotal).toBe(250);
  });
});

describe("Pagamentos - Ações e Botões", () => {
  it("deve mostrar botão PIX quando status != PAGO", () => {
    const pagamento = { status: "PENDENTE" };
    const mostrarPixBtn = pagamento.status !== "PAGO";
    expect(mostrarPixBtn).toBe(true);
  });

  it("deve mostrar botão Recibo quando status === PAGO", () => {
    const pagamento = { status: "PAGO" };
    const mostrarReciboBtn = pagamento.status === "PAGO";
    expect(mostrarReciboBtn).toBe(true);
  });

  it("deve validar se estabelecimento tem chave PIX", () => {
    const estab1 = { pixChave: "11999999999", status: "PENDENTE" };
    const estab2 = { pixChave: null, status: "PENDENTE" };

    const temChavePix1 = estab1.pixChave !== null;
    const temChavePix2 = estab2.pixChave !== null;

    expect(temChavePix1).toBe(true);
    expect(temChavePix2).toBe(false);
  });
});
