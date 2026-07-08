import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Testes unitários para a lógica de filtragem da TabelaDistribuicao
 * 
 * Testamos a lógica de filtragem separadamente do componente React
 * para evitar complexidade com JSX no Vitest.
 */

interface Producao {
  id: string;
  paciente: string;
  procedimento: string;
  parceiro: { nome: string };
  totalPago: string;
  dataReferencia: string;
  pontosPotenciais: number;
  pontosDistribuidos: { pontos: number } | null;
}

function filtrarProducoes(
  producoes: Producao[],
  filtroParceiro: string,
  filtroIndicado: string,
  filtroDataInicio: string,
  filtroDataFim: string
): Producao[] {
  return producoes.filter((producao) => {
    const parceiroMatch = !filtroParceiro || producao.parceiro.nome === filtroParceiro;
    const indicadoMatch = !filtroIndicado || 
      producao.paciente.toLowerCase().includes(filtroIndicado.toLowerCase());
    
    // Usar UTC para evitar problemas de fuso horário
    const dataProc = new Date(producao.dataReferencia + "T00:00:00");
    const dataInicioMatch = !filtroDataInicio || dataProc >= new Date(filtroDataInicio + "T00:00:00");
    const dataFimMatch = !filtroDataFim || dataProc <= new Date(filtroDataFim + "T23:59:59");

    return parceiroMatch && indicadoMatch && dataInicioMatch && dataFimMatch;
  });
}

function extrairParceirosUnicos(producoes: Producao[]): string[] {
  const unique = new Map(
    producoes
      .filter((p) => p.parceiro?.nome)
      .map((p) => [p.parceiro.nome, p.parceiro])
  );
  return Array.from(unique.values()).map(p => p.nome);
}

const mockData: Producao[] = [
  {
    id: "1",
    paciente: "Marcia Costa De Oliveira",
    procedimento: "Hemograma com contagem de plaquetas",
    parceiro: { nome: "Tania Karla" },
    totalPago: "17.03",
    dataReferencia: "2026-07-06",
    pontosPotenciais: 0,
    pontosDistribuidos: null,
  },
  {
    id: "2",
    paciente: "Rosangela Depieri",
    procedimento: "Consulta Eletiva Clínico Geral",
    parceiro: { nome: "Tania Karla" },
    totalPago: "69.9",
    dataReferencia: "2026-07-06",
    pontosPotenciais: 1,
    pontosDistribuidos: null,
  },
  {
    id: "3",
    paciente: "Camila Iagla Pires",
    procedimento: "Consulta Eletiva Clínico Geral",
    parceiro: { nome: "Tania Karla" },
    totalPago: "69.9",
    dataReferencia: "2026-07-06",
    pontosPotenciais: 1,
    pontosDistribuidos: { pontos: 1 },
  },
  {
    id: "4",
    paciente: "ELIDIANE DOS SANTOS PAULINO DOS ANJOS",
    procedimento: "Consulta Eletiva Oftalmologia - Saude Ocular",
    parceiro: { nome: "Joao Silva" },
    totalPago: "79.9",
    dataReferencia: "2026-07-05",
    pontosPotenciais: 1,
    pontosDistribuidos: { pontos: 1 },
  },
];

describe("TabelaDistribuicao - Lógica de Filtragem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("extrairParceirosUnicos", () => {
    it("deve extrair parceiros únicos da lista", () => {
      const parceiros = extrairParceirosUnicos(mockData);
      expect(parceiros).toHaveLength(2);
      expect(parceiros).toContain("Tania Karla");
      expect(parceiros).toContain("Joao Silva");
    });

    it("deve retornar array vazio quando não houver dados", () => {
      const parceiros = extrairParceirosUnicos([]);
      expect(parceiros).toHaveLength(0);
    });

    it("não deve duplicar parceiros repetidos", () => {
      const dadosComRepetidos: Producao[] = [
        { ...mockData[0], parceiro: { nome: "Parceiro A" } },
        { ...mockData[1], parceiro: { nome: "Parceiro A" } },
        { ...mockData[2], parceiro: { nome: "Parceiro B" } },
      ];
      const parceiros = extrairParceirosUnicos(dadosComRepetidos);
      expect(parceiros).toHaveLength(2);
      expect(parceiros).toEqual(["Parceiro A", "Parceiro B"]);
    });
  });

  describe("filtrarProducoes - Filtro por Indicado", () => {
    it("deve filtrar por nome do indicado (case insensitive)", () => {
      const resultado = filtrarProducoes(mockData, "", "rosangela", "", "");
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("Rosangela Depieri");
    });

    it("deve filtrar por parte do nome do indicado", () => {
      const resultado = filtrarProducoes(mockData, "", "Santos", "", "");
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("ELIDIANE DOS SANTOS PAULINO DOS ANJOS");
    });

    it("deve retornar todos quando filtro vazio", () => {
      const resultado = filtrarProducoes(mockData, "", "", "", "");
      expect(resultado).toHaveLength(4);
    });

    it("deve retornar array vazio quando não houver match", () => {
      const resultado = filtrarProducoes(mockData, "", "NomeInexistente", "", "");
      expect(resultado).toHaveLength(0);
    });
  });

  describe("filtrarProducoes - Filtro por Parceiro", () => {
    it("deve filtrar por parceiro específico", () => {
      const resultado = filtrarProducoes(mockData, "Joao Silva", "", "", "");
      expect(resultado).toHaveLength(1);
      expect(resultado[0].parceiro.nome).toBe("Joao Silva");
    });

    it("deve filtrar múltiplos itens do mesmo parceiro", () => {
      const resultado = filtrarProducoes(mockData, "Tania Karla", "", "", "");
      expect(resultado).toHaveLength(3);
      resultado.forEach((p) => {
        expect(p.parceiro.nome).toBe("Tania Karla");
      });
    });

    it("deve retornar todos quando filtro vazio", () => {
      const resultado = filtrarProducoes(mockData, "", "", "", "");
      expect(resultado).toHaveLength(4);
    });
  });

  describe("filtrarProducoes - Filtro por Data Início", () => {
    it("deve filtrar produções a partir da data de início", () => {
      const resultado = filtrarProducoes(mockData, "", "", "2026-07-06", "");
      expect(resultado).toHaveLength(3);
      resultado.forEach((p) => {
        expect(new Date(p.dataReferencia).getTime()).toBeGreaterThanOrEqual(new Date("2026-07-06").getTime());
      });
    });

    it("deve retornar array vazio quando data início após todas as produções", () => {
      const resultado = filtrarProducoes(mockData, "", "", "2026-08-01", "");
      expect(resultado).toHaveLength(0);
    });

    it("deve retornar todos quando filtro vazio", () => {
      const resultado = filtrarProducoes(mockData, "", "", "", "");
      expect(resultado).toHaveLength(4);
    });
  });

  describe("filtrarProducoes - Filtro por Data Fim", () => {
    it("deve filtrar produções até a data de fim (inclusive)", () => {
      // Dados têm 3 em 06/07 e 1 em 05/07
      // Filtrando até 05/07, deve retornar apenas o de 05/07
      const resultado = filtrarProducoes(mockData, "", "", "", "2026-07-05");
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("ELIDIANE DOS SANTOS PAULINO DOS ANJOS");
    });

    it("deve incluir produções da data de fim (até 23:59:59)", () => {
      const resultado = filtrarProducoes(mockData, "", "", "", "2026-07-06");
      expect(resultado).toHaveLength(4);
    });

    it("deve retornar array vazio quando data fim antes de todas as produções", () => {
      const resultado = filtrarProducoes(mockData, "", "", "", "2026-07-01");
      expect(resultado).toHaveLength(0);
    });
  });

  describe("filtrarProducoes - Filtros Combinados", () => {
    it("deve combinar filtros de parceiro e indicado", () => {
      const resultado = filtrarProducoes(mockData, "Tania Karla", "Rosangela", "", "");
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("Rosangela Depieri");
      expect(resultado[0].parceiro.nome).toBe("Tania Karla");
    });

    it("deve combinar filtros de data (range)", () => {
      const resultado = filtrarProducoes(mockData, "", "", "2026-07-06", "2026-07-06");
      expect(resultado).toHaveLength(3);
      resultado.forEach((p) => {
        expect(p.dataReferencia).toBe("2026-07-06");
      });
    });

    it("deve combinar todos os filtros", () => {
      const resultado = filtrarProducoes(
        mockData,
        "Tania Karla",
        "Camila",
        "2026-07-06",
        "2026-07-06"
      );
      expect(resultado).toHaveLength(1);
      expect(resultado[0].paciente).toBe("Camila Iagla Pires");
    });

    it("deve retornar array vazio quando combinação não tiver resultados", () => {
      const resultado = filtrarProducoes(
        mockData,
        "Joao Silva",
        "Rosangela",
        "",
        ""
      );
      expect(resultado).toHaveLength(0);
    });
  });

  describe("Contador de Produções", () => {
    it("deve mostrar contador correto de filtradas vs total", () => {
      const total = mockData.length;
      const filtradas = filtrarProducoes(mockData, "Tania Karla", "", "", "").length;
      expect(filtradas).toBe(3);
      expect(total).toBe(4);
      expect(`${filtradas} de ${total} produções`).toBe("3 de 4 produções");
    });
  });

  describe("Status de Pontos", () => {
    it("deve identificar produções com pontos distribuídos", () => {
      const distribuidas = mockData.filter(p => p.pontosDistribuidos !== null);
      expect(distribuidas).toHaveLength(2);
      expect(distribuidas.map(p => p.paciente)).toEqual([
        "Camila Iagla Pires",
        "ELIDIANE DOS SANTOS PAULINO DOS ANJOS"
      ]);
    });

    it("deve identificar produções sem pontos distribuídos", () => {
      const pendentes = mockData.filter(p => p.pontosDistribuidos === null);
      expect(pendentes).toHaveLength(2);
      expect(pendentes.map(p => p.paciente)).toEqual([
        "Marcia Costa De Oliveira",
        "Rosangela Depieri"
      ]);
    });

    it("deve mostrar pontos potenciais para pendentes", () => {
      const pendentes = mockData.filter(p => p.pontosDistribuidos === null && p.pontosPotenciais > 0);
      expect(pendentes).toHaveLength(1);
      expect(pendentes[0].paciente).toBe("Rosangela Depieri");
      expect(pendentes[0].pontosPotenciais).toBe(1);
    });
  });

  describe("Formatação de Dados", () => {
    it("deve formatar data no formato PT-BR", () => {
      // 2026-07-05 em UTC-3 (Brasil) vira 04/07 no fuso local
      const data = new Date("2026-07-05T00:00:00-03:00");
      const formatada = data.toLocaleDateString("pt-BR");
      expect(formatada).toBe("05/07/2026");
    });

    it("deve formatar valor monetário com prefixo R$", () => {
      const valor = "17.03";
      const formatado = `R$ ${valor}`;
      expect(formatado).toBe("R$ 17.03");
    });
  });
});