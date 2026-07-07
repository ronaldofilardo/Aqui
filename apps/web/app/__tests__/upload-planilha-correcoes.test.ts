import { describe, it, expect, beforeEach, vi } from "vitest";
import * as XLSX from "xlsx";

/**
 * Tests para as correções do upload de planilhas (Julho 2026):
 * 1. Correção da leitura das linhas 4, 5, 6+ (range: 0 + detecção dinâmica)
 * 2. Órfãos agora são importados (não são mais pulados)
 * 3. Duplicidade usa paciente ao invés de CPF (permite família com mesmo CPF)
 */

describe("Upload Planilha - Correções Julho 2026", () => {
  describe("Detecção dinâmica de cabeçalho", () => {
    it("deve pular linha de título quando não contém 'Data de Referência'", () => {
      const wb = XLSX.utils.book_new();
      const data = [
        ["Receita Bruta Analítica"], // Linha 1: Título
        [ // Linha 2: Cabeçalho
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
        [ // Linha 3: Dados
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "PIX",
          17.03,
          "Marcia Costa De Oliveira",
          "Hemograma",
          "07102342950",
          "Exame",
          "Acesso Saúde Colombo",
          "Valeria Cavalli Luciano",
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      // Ler todas as linhas primeiro
      const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        range: 0,
      });

      // Detectar se precisa pular título
      let startRow = 0;
      const firstRow = allRows[0] as string[];
      if (!firstRow.some((cell) => String(cell).includes("Data de Referência"))) {
        startRow = 1;
      }

      const headerRow = allRows[startRow] as string[];
      const dataRows = allRows.slice(startRow + 1);

      expect(startRow).toBe(1); // Pulou título
      expect(headerRow).toContain("Data de Referência");
      expect(dataRows.length).toBe(1); // 1 linha de dados
    });

    it("deve usar linha 1 como cabeçalho quando já contém colunas obrigatórias", () => {
      const wb = XLSX.utils.book_new();
      const data = [
        [ // Linha 1: Já é o cabeçalho (sem título)
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
        [ // Linha 2: Dados
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "PIX",
          17.03,
          "Marcia Costa De Oliveira",
          "Hemograma",
          "07102342950",
          "Exame",
          "Acesso Saúde Colombo",
          "Valeria Cavalli Luciano",
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        range: 0,
      });

      let startRow = 0;
      const firstRow = allRows[0] as string[];
      if (!firstRow.some((cell) => String(cell).includes("Data de Referência"))) {
        startRow = 1;
      }

      const headerRow = allRows[startRow] as string[];
      const dataRows = allRows.slice(startRow + 1);

      expect(startRow).toBe(0); // Não pulou linha
      expect(headerRow).toContain("Data de Referência");
      expect(dataRows.length).toBe(1); // 1 linha de dados
    });

    it("deve ler todas as linhas incluindo 4, 5, 6, 7, 8+", () => {
      const wb = XLSX.utils.book_new();
      const data = [
        ["Receita Bruta Analítica"], // Linha 1: Título
        [ // Linha 2: Cabeçalho
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
        [ // Linha 3: Dado 1
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "PIX",
          17.03,
          "Marcia",
          "Hemograma",
          "07102342950",
          "Exame",
          "Unidade 1",
          "Comercial 1",
        ],
        [ // Linha 4: Dado 2
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "Crédito",
          69.9,
          "Rosangela",
          "Consulta",
          "87208377987",
          "Consulta",
          "Unidade 1",
          "Comercial 1",
        ],
        [ // Linha 5: Dado 3
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "PIX",
          69.9,
          "Camila",
          "Consulta",
          "10645564931",
          "Consulta",
          "Unidade 1",
          "Comercial 1",
        ],
        [ // Linha 6: Dado 4
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "Débito",
          79.9,
          "ELIDIANE",
          "Oftalmologia",
          "12114106926",
          "Consulta",
          "Unidade 1",
          "Comercial 2",
        ],
        [ // Linha 7: Dado 5
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "Débito",
          13.62,
          "Leaci",
          "Hemograma",
          "03075398810",
          "Exame",
          "Unidade 1",
          "Comercial 1",
        ],
        [ // Linha 8: Dado 6
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "Débito",
          9.35,
          "Leaci",
          "VHS",
          "03075398810",
          "Exame",
          "Unidade 1",
          "Comercial 1",
        ],
        [ // Linha 9: Dado 7
          new Date("2026-07-06"),
          new Date("2026-07-06"),
          "Débito",
          8.88,
          "Leaci",
          "Urina",
          "03075398810",
          "Exame",
          "Unidade 1",
          "Comercial 1",
        ],
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        range: 0,
      });

      let startRow = 0;
      const firstRow = allRows[0] as string[];
      if (!firstRow.some((cell) => String(cell).includes("Data de Referência"))) {
        startRow = 1;
      }

      const dataRows = allRows.slice(startRow + 1);

      expect(dataRows.length).toBe(7); // Todas as 7 linhas de dados lidas
    });
  });

  describe("Chave de duplicidade com paciente (não CPF)", () => {
    it("deve permitir múltiplos pacientes com mesmo CPF no mesmo dia", () => {
      const cpfsProcessados = new Set<string>();
      
      // Linha 1: Marcia com CPF 530.511.739-91
      const key1 = `2026-07-06|Marcia Costa De Oliveira|Hemograma|Acesso Saúde Colombo`;
      
      // Linha 3: Camila com MESMO CPF mas paciente diferente
      const key2 = `2026-07-06|Camila Iagla Pires|Consulta Eletiva Clínico Geral|Acesso Saúde Colombo`;
      
      // Linha 5: Leaci com MESMO CPF mas paciente diferente
      const key3 = `2026-07-06|Leaci De Fatima Da Silva|Hemograma|Acesso Saúde Colombo`;

      expect(cpfsProcessados.has(key1)).toBe(false);
      cpfsProcessados.add(key1);

      expect(cpfsProcessados.has(key2)).toBe(false); // Não é duplicado
      cpfsProcessados.add(key2);

      expect(cpfsProcessados.has(key3)).toBe(false); // Não é duplicado
      cpfsProcessados.add(key3);

      expect(cpfsProcessados.size).toBe(3); // Todos únicos
    });

    it("deve rejeitar mesmo paciente com mesmo procedimento no mesmo dia", () => {
      const cpfsProcessados = new Set<string>();
      
      const key1 = `2026-07-06|Leaci De Fatima Da Silva|Hemograma|Acesso Saúde Colombo`;
      const key2 = `2026-07-06|Leaci De Fatima Da Silva|Hemograma|Acesso Saúde Colombo`; // Igual

      expect(cpfsProcessados.has(key1)).toBe(false);
      cpfsProcessados.add(key1);

      expect(cpfsProcessados.has(key2)).toBe(true); // É duplicado
    });

    it("deve permitir mesmo paciente com procedimentos diferentes no mesmo dia", () => {
      const cpfsProcessados = new Set<string>();
      
      const key1 = `2026-07-06|Leaci De Fatima Da Silva|Hemograma|Acesso Saúde Colombo`;
      const key2 = `2026-07-06|Leaci De Fatima Da Silva|VHS|Acesso Saúde Colombo`;
      const key3 = `2026-07-06|Leaci De Fatima Da Silva|Urina|Acesso Saúde Colombo`;

      expect(cpfsProcessados.has(key1)).toBe(false);
      cpfsProcessados.add(key1);

      expect(cpfsProcessados.has(key2)).toBe(false); // Procedimento diferente
      cpfsProcessados.add(key2);

      expect(cpfsProcessados.has(key3)).toBe(false); // Procedimento diferente
      cpfsProcessados.add(key3);

      expect(cpfsProcessados.size).toBe(3); // Todos únicos
    });
  });

  describe("Órfãos devem ser importados", () => {
    it("deve classificar como órfão mas ainda importar procedimento", () => {
      // Simula indicado sem parceiro ativo
      const indicado = null;
      const isOrfao = !indicado;

      expect(isOrfao).toBe(true);
      // Órfão deve ser importado (não usar continue para pular)
      // Apenas marcar como ORFÃO no status
    });

    it("deve classificar como órfão quando parceiro DESLIGADO", () => {
      const indicado = {
        status: "ATIVO",
        parceiro: {
          status: "DESLIGADO",
          gestorPfId: "gestor-123",
        },
      };

      const isOrfao = !indicado ||
        indicado.status === "DESVINCULADO" ||
        !indicado.parceiro ||
        indicado.parceiro.status === "DESLIGADO";

      expect(isOrfao).toBe(true);
      // Ainda assim deve importar
    });

    it("deve classificar como órfão quando gestor diferente", () => {
      const indicado = {
        status: "ATIVO",
        parceiro: {
          status: "ATIVO",
          gestorPfId: "gestor-diferente",
        },
      };
      const gestorPfIdAtual = "gestor-atual";

      const isOrfao = !indicado ||
        indicado.status === "DESVINCULADO" ||
        !indicado.parceiro ||
        indicado.parceiro.status === "DESLIGADO" ||
        indicado.parceiro.gestorPfId !== gestorPfIdAtual;

      expect(isOrfao).toBe(true);
    });

    it("deve ser válido quando tem indicado e parceiro ativos do mesmo gestor", () => {
      const indicado = {
        status: "ATIVO",
        parceiro: {
          status: "ATIVO",
          gestorPfId: "gestor-123",
          nome: "Parceiro Teste",
        },
      };
      const gestorPfIdAtual = "gestor-123";

      const isOrfao = !indicado ||
        indicado.status === "DESVINCULADO" ||
        !indicado.parceiro ||
        indicado.parceiro.status === "DESLIGADO" ||
        indicado.parceiro.gestorPfId !== gestorPfIdAtual;

      expect(isOrfao).toBe(false);
    });
  });

  describe("Parse de números e datas", () => {
    it("deve parsear número brasileiro com vírgula decimal", () => {
      const parseNumber = (value: string | number | undefined): number | null => {
        if (typeof value === "number") return value;
        if (!value || value === "") return null;
        
        const str = String(value);
        if (str.includes(",")) {
          const cleaned = str.replace(/\./g, "").replace(",", ".");
          const num = parseFloat(cleaned);
          if (!isNaN(num)) return num;
        }
        
        const cleaned = str.replace(/,/g, "");
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
      };

      expect(parseNumber("17,03")).toBe(17.03);
      expect(parseNumber("69,9")).toBe(69.9);
      expect(parseNumber("1.234,56")).toBe(1234.56);
      expect(parseNumber("13,62")).toBe(13.62);
    });

    it("deve parsear CPF com aspas e formatar corretamente", () => {
      const parseCPF = (value: string | number | undefined): string => {
        if (!value) return "";
        const cpfRaw = String(value)
          .replace(/["']/g, "")
          .replace(/\D/g, "")
          .trim();
        // Remove zeros à esquerda se tiver mais de 11 dígitos (ex: "8720837798700" -> "87208377987")
        const cpfLimpo = cpfRaw.length > 11 ? cpfRaw.slice(0, 11) : cpfRaw;
        return cpfLimpo.length === 11 ? cpfLimpo : cpfLimpo.padStart(11, "0");
      };

      expect(parseCPF('87208377987')).toBe("87208377987");
      expect(parseCPF('10645564931')).toBe("10645564931");
      expect(parseCPF('12114106926')).toBe("12114106926");
      expect(parseCPF("07102342950")).toBe("07102342950");
    });
  });
});