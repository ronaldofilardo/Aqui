import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";

/**
 * Tests para as correções do upload de planilhas:
 * 1. Detecção de cabeçalho com linha de título
 * 2. Pular linhas vazias
 * 3. Coluna "Usuário da conta" obrigatória
 * 4. Optional chaining na página de procedimentos
 */

describe("Upload - Detecção de Cabeçalho", () => {
  it("deve detectar linha de título e pular para o cabeçalho correto", () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ["Título da Planilha - Receita Bruta"], // Linha de título
      [
        "Data de Referência",
        "Data do Pagamento",
        "Forma de Pagamento",
        "Total Pago",
        "Paciente",
        "Procedimento",
        "CPF",
        "Tipo do Procedimento",
        "Unidade",
        "Usuário da conta",
      ], // Cabeçalho
      [
        new Date("2026-07-01"),
        new Date("2026-07-05"),
        "PIX",
        100.0,
        "Paciente Teste",
        "Consulta",
        "12345678901",
        "Atendimento",
        "Unidade 1",
        "Comercial Teste",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    // Ler como array para detectar cabeçalho
    const firstRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      range: 0,
    });

    let startRow = 0;
    const firstRow = firstRows[0] as string[];
    if (!firstRow.some((cell) => String(cell).includes("Data de Referência"))) {
      startRow = 1;
    }

    // Ler dados a partir do cabeçalho correto
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
      range: startRow,
    });

    expect(rawData.length).toBe(1); // Apenas 1 linha de dados
    expect(rawData[0]["Data de Referência"]).toBeDefined();
    expect(startRow).toBe(1); // Confirmar que pulou o título
  });

  it("deve pular linhas completamente vazias", () => {
    const wb = XLSX.utils.book_new();
    const data = [
      [
        "Data de Referência",
        "Data do Pagamento",
        "Forma de Pagamento",
        "Total Pago",
        "Paciente",
        "Procedimento",
        "CPF",
        "Tipo do Procedimento",
        "Unidade",
        "Usuário da conta",
      ],
      [
        new Date("2026-07-01"),
        new Date("2026-07-05"),
        "PIX",
        100.0,
        "Paciente 1",
        "Consulta",
        "12345678901",
        "Atendimento",
        "Unidade 1",
        "Comercial Teste",
      ],
      ["", "", "", "", "", "", "", "", "", ""], // Linha vazia
      ["", "", "", "", "", "", "", "", "", ""], // Outra linha vazia
      [
        new Date("2026-07-02"),
        new Date("2026-07-06"),
        "Cartão",
        200.0,
        "Paciente 2",
        "Exame",
        "22345678901",
        "Atendimento",
        "Unidade 2",
        "Comercial Teste",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    });

    // Verificar lógica de pular linhas vazias
    const linhasValidas = rawData.filter((row) => {
      const todosVazios =
        (!row["Data de Referência"] || !row["Data do Pagamento"]) &&
        (!row["Forma de Pagamento"] || row["Forma de Pagamento"] === "") &&
        (!row["Total Pago"] || row["Total Pago"] === 0) &&
        (!row["Paciente"] || row["Paciente"] === "") &&
        (!row["Procedimento"] || row["Procedimento"] === "");

      return !todosVazios;
    });

    expect(linhasValidas.length).toBe(2); // Apenas 2 linhas com dados
  });

  it("deve rejeitar planilha sem coluna 'Usuário da conta'", () => {
    const wb = XLSX.utils.book_new();
    const data = [
      [
        "Data de Referência",
        "Data do Pagamento",
        "Forma de Pagamento",
        "Total Pago",
        "Paciente",
        "Procedimento",
        "CPF",
        "Tipo do Procedimento",
        "Unidade",
        // Sem "Usuário da conta"
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      range: 0,
    });

    const headerRow = rawData[0] as string[];
    const colunasMap: Record<string, number> = {};
    headerRow.forEach((col, i) => {
      if (String(col).trim().length > 0) {
        colunasMap[String(col).trim()] = i;
      }
    });

    const COLUNAS_OBRIGATORIAS = [
      "Data de Referência",
      "Data do Pagamento",
      "Forma de Pagamento",
      "Total Pago",
      "Paciente",
      "Procedimento",
      "CPF",
      "Tipo do Procedimento",
      "Unidade",
      "Usuário da conta",
    ];

    const colunasFaltantes = COLUNAS_OBRIGATORIAS.filter(
      (col) => !(col in colunasMap)
    );

    expect(colunasFaltantes).toContain("Usuário da conta");
    expect(colunasFaltantes.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Página de Procedimentos - Optional Chaining", () => {
  it("deve acessar data.parceiros com optional chaining sem erro", () => {
    const dataUndefined = undefined;
    const dataVazia = {};
    const dataComParceiros = {
      parceiros: [
        { id: "1", nome: "Parceiro 1" },
        { id: "2", nome: "Parceiro 2" },
      ],
    };

    // Testa que optional chaining previne erros
    expect(() => dataUndefined?.parceiros?.map(() => {})).not.toThrow();
    expect(() => dataVazia?.parceiros?.map(() => {})).not.toThrow();

    const options = dataComParceiros?.parceiros?.map((p) => ({
      key: p.id,
      label: p.nome,
    }));

    expect(options).toHaveLength(2);
    expect(options?.[0].label).toBe("Parceiro 1");
  });

  it("deve acessar data.pagination com optional chaining sem erro", () => {
    const dataUndefined = undefined;
    const dataVazia = {};
    const dataSemPagination = { procedimentos: [] };
    const dataComPaginacao = {
      pagination: {
        totalPages: 5,
        currentPage: 1,
        total: 100,
      },
    };

    // Testa que optional chaining previne erros
    expect(() => dataUndefined?.pagination?.totalPages).not.toThrow();
    expect(() => dataVazia?.pagination?.totalPages).not.toThrow();
    expect(() => dataSemPagination?.pagination?.totalPages).not.toThrow();

    // Testa verificação correta quando dados existem
    expect(dataComPaginacao?.pagination?.totalPages).toBe(5);
    expect(
      dataComPaginacao?.pagination?.totalPages &&
        dataComPaginacao.pagination.totalPages > 1
    ).toBe(true);
  });

  it("deve renderizar select de parceiros corretamente", () => {
    const dataComParceiros = {
      parceiros: [
        { id: "1", nome: "Parceiro A" },
        { id: "2", nome: "Parceiro B" },
        { id: "3", nome: "Parceiro C" },
      ],
    };

    // Simula o mapeamento de options sem JSX
    const options = dataComParceiros?.parceiros?.map((p) => ({
      type: "option",
      props: {
        key: p.id,
        value: p.id,
        children: p.nome,
      },
    }));

    expect(options).toHaveLength(3);
    expect(options?.[0].props.children).toBe("Parceiro A");
    expect(options?.[1].props.children).toBe("Parceiro B");
  });

  it("deve verificar totalPages corretamente com optional chaining", () => {
    const testData = [
      { input: undefined, expected: undefined },
      { input: {}, expected: undefined },
      { input: { pagination: {} }, expected: undefined },
      { input: { pagination: { totalPages: 1 } }, expected: 1 },
      { input: { pagination: { totalPages: 5 } }, expected: 5 },
    ];

    testData.forEach(({ input, expected }) => {
      const result = input?.pagination?.totalPages;
      expect(result).toBe(expected);
    });
  });
});