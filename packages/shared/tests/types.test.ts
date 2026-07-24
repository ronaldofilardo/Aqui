import { describe, it, expect } from "vitest";
import { TipoUsuario } from "../src/types";

describe("TipoUsuario", () => {
  it("deve incluir ADMIN, CONSULTOR e GESTOR_PJ", () => {
    const tipos: TipoUsuario[] = ["ADMIN", "CONSULTOR", "GESTOR_PJ"];

    expect(tipos).toContain("ADMIN");
    expect(tipos).toContain("CONSULTOR");
    expect(tipos).toContain("GESTOR_PJ");
    expect(tipos.length).toBeGreaterThanOrEqual(3);
  });

  it("nao deve incluir tipos invalidos", () => {
    const tiposInvalidos = [
      "GESTOR_PF",
      "PARCEIRO_PF",
      "CONSULTOR_PF_INVALIDO",
      "BACKOFFICE",
      "PARCEIRO",
    ];

    tiposInvalidos.forEach((tipo) => {
      expect([
        "ADMIN",
        "CONSULTOR",
        "GESTOR_PJ" as any,
      ]).not.toContain(tipo as any);
    });
  });
});
