import { describe, it, expect } from "vitest";

describe("Formatação de Moeda Brasileira", () => {
  function formatarMoeda(valor: string): string {
    const numeros = valor.replace(/\D/g, "");
    const numero = Number(numeros) / 100;
    return numero.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function parseMoeda(valor: string): string {
    const numeros = valor.replace(/\./g, "").replace(",", ".");
    return numeros;
  }

  describe("formatarMoeda", () => {
    it("deve formatar valor sem centavos", () => {
      expect(formatarMoeda("100000")).toBe("1.000,00");
      expect(formatarMoeda("500000")).toBe("5.000,00");
    });

    it("deve formatar valor com centavos", () => {
      expect(formatarMoeda("123456")).toBe("1.234,56");
      expect(formatarMoeda("987654")).toBe("9.876,54");
    });

    it("deve formatar valores pequenos", () => {
      expect(formatarMoeda("100")).toBe("1,00");
      expect(formatarMoeda("50")).toBe("0,50");
      expect(formatarMoeda("5")).toBe("0,05");
    });

    it("deve formatar valores grandes", () => {
      expect(formatarMoeda("100000000")).toBe("1.000.000,00");
      expect(formatarMoeda("999999999")).toBe("9.999.999,99");
    });

    it("deve retornar 0,00 para string vazia", () => {
      expect(formatarMoeda("")).toBe("0,00");
    });

    it("deve ignorar caracteres não numéricos", () => {
      expect(formatarMoeda("abc123")).toBe("1,23");
      expect(formatarMoeda("12.345,67")).toBe("12.345,67");
    });

    it("deve formatar valor com zeros à esquerda", () => {
      expect(formatarMoeda("001234")).toBe("12,34");
    });

    it("deve manter duas casas decimais sempre", () => {
      expect(formatarMoeda("100")).toBe("1,00");
      expect(formatarMoeda("10")).toBe("0,10");
      expect(formatarMoeda("1")).toBe("0,01");
    });
  });

  describe("parseMoeda", () => {
    it("deve converter formato brasileiro para número", () => {
      expect(parseMoeda("1.000,00")).toBe("1000.00");
      expect(parseMoeda("5.000,00")).toBe("5000.00");
    });

    it("deve remover pontos de milhar", () => {
      expect(parseMoeda("1.234,56")).toBe("1234.56");
      expect(parseMoeda("999.999,99")).toBe("999999.99");
    });

    it("deve converter vírgula decimal para ponto", () => {
      expect(parseMoeda("100,50")).toBe("100.50");
      expect(parseMoeda("0,99")).toBe("0.99");
    });

    it("deve lidar com valores grandes", () => {
      expect(parseMoeda("1.000.000,00")).toBe("1000000.00");
    });

    it("deve lidar com valores pequenos", () => {
      expect(parseMoeda("0,01")).toBe("0.01");
      expect(parseMoeda("0,10")).toBe("0.10");
    });

    it("deve retornar string vazia para entrada vazia", () => {
      expect(parseMoeda("")).toBe("");
    });

    it("deve lidar apenas com números sem formatação", () => {
      expect(parseMoeda("1000")).toBe("1000");
      expect(parseMoeda("123456")).toBe("123456");
    });
  });

  describe("Round-trip: formatar -> parse -> formatar", () => {
    it("deve manter valor após formatar e parsear", () => {
      const original = "123456";
      const formatado = formatarMoeda(original);
      const parseado = parseMoeda(formatado);
      const numeroFinal = parseFloat(parseado);
      
      expect(numeroFinal).toBe(1234.56);
    });

    it("deve manter valor grande após round-trip", () => {
      const original = "99999999";
      const formatado = formatarMoeda(original);
      const parseado = parseMoeda(formatado);
      const numeroFinal = parseFloat(parseado);
      
      expect(numeroFinal).toBe(999999.99);
    });

    it("deve manter valor pequeno após round-trip", () => {
      const original = "123";
      const formatado = formatarMoeda(original);
      const parseado = parseMoeda(formatado);
      const numeroFinal = parseFloat(parseado);
      
      expect(numeroFinal).toBe(1.23);
    });
  });
});