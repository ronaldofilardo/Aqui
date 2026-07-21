import { describe, it, expect } from "vitest";
import { upsertMetaComercialSchema } from "@asa/shared";

describe("upsertMetaComercialSchema - Meta e Produção", () => {
  describe("Validações de Schema", () => {
    it("deve aceitar apenas valorMeta", () => {
      const input = {
        mesReferencia: "2026-01",
        valorMeta: 1000,
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("deve aceitar apenas valorAtingido", () => {
      const input = {
        mesReferencia: "2026-01",
        valorAtingido: 850,
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("deve aceitar ambos valorMeta e valorAtingido", () => {
      const input = {
        mesReferencia: "2026-01",
        valorMeta: 1000,
        valorAtingido: 850,
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar quando nenhum valor é fornecido", () => {
      const input = {
        mesReferencia: "2026-01",
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain("valorMeta ou valorAtingido");
    });

    it("deve aceitar valorMeta como string", () => {
      const input = {
        mesReferencia: "2026-01",
        valorMeta: "1000",
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("deve aceitar valorAtingido como string", () => {
      const input = {
        mesReferencia: "2026-01",
        valorAtingido: "850",
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("deve aceitar valores decimais", () => {
      const input = {
        mesReferencia: "2026-01",
        valorMeta: 1000.50,
        valorAtingido: 850.75,
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("deve aceitar valor zero", () => {
      const input = {
        mesReferencia: "2026-01",
        valorMeta: 0,
        valorAtingido: 0,
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar valorMeta negativo", () => {
      const input = {
        mesReferencia: "2026-01",
        valorMeta: -100,
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain(">= 0");
    });

    it("deve rejeitar valorAtingido negativo", () => {
      const input = {
        mesReferencia: "2026-01",
        valorAtingido: -50,
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toContain(">= 0");
    });

    it("deve validar formato do mesReferencia YYYY-MM", () => {
      const inputValido = {
        mesReferencia: "2026-01",
        valorMeta: 1000,
      };

      const inputInvalido = {
        mesReferencia: "01-2026",
        valorMeta: 1000,
      };

      expect(upsertMetaComercialSchema.safeParse(inputValido).success).toBe(true);
      expect(upsertMetaComercialSchema.safeParse(inputInvalido).success).toBe(false);
    });
  });

  describe("Parse e Transformação", () => {
    it("deve fazer parse de valorMeta string para número", () => {
      const input = {
        mesReferencia: "2026-01",
        valorMeta: "1500.50",
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valorMeta).toBe("1500.50");
      }
    });

    it("deve fazer parse de valorAtingido string para número", () => {
      const input = {
        mesReferencia: "2026-01",
        valorAtingido: "1234.56",
      };

      const result = upsertMetaComercialSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.valorAtingido).toBe("1234.56");
      }
    });
  });
});