import { describe, it, expect } from "vitest";
import { formatCNPJ, validarCNPJ, validarChavePix, initialFormData } from "../lib/utils";

describe("utils - formatCNPJ", () => {
  it("deve formatar 14 dígitos como CNPJ", () => {
    expect(formatCNPJ("12345678000199")).toBe("12.345.678/0001-99");
  });

  it("deve formatar parcialmente", () => {
    expect(formatCNPJ("123456")).toBe("12.345.6");
  });

  it("deve ignorar não-dígitos", () => {
    expect(formatCNPJ("12.345.678/0001-99")).toBe("12.345.678/0001-99");
  });

  it("deve limitar a 14 dígitos", () => {
    expect(formatCNPJ("1234567890123456")).toBe("12.345.678/9012-34");
  });

  it("deve retornar vazio para entrada vazia", () => {
    expect(formatCNPJ("")).toBe("");
  });
});

describe("utils - validarCNPJ", () => {
  it("deve validar CNPJ 55.237.891/0001-96", () => {
      expect(validarCNPJ("55.237.891/0001-96")).toBe(true);
    });

  it("deve invalidar CNPJ com dígitos repetidos", () => {
    expect(validarCNPJ("11.111.111/1111-11")).toBe(false);
  });

  it("deve invalidar CNPJ curto", () => {
    expect(validarCNPJ("12.345.678/0001-9")).toBe(false);
  });

  it("deve invalidar CNPJ longo", () => {
    expect(validarCNPJ("12.345.678/0001-990")).toBe(false);
  });

  it("deve invalidar CNPJ com zeros", () => {
    expect(validarCNPJ("00.000.000/0000-00")).toBe(false);
  });
});

describe("utils - validarChavePix", () => {
  it("deve retornar true quando chave e tipo vazios", () => {
    expect(validarChavePix("", "")).toBe(true);
  });

  it("deve retornar true quando só tipo existe", () => {
    expect(validarChavePix("", "CPF")).toBe(true);
  });

  it("deve validar PIX CPF válido", () => {
    expect(validarChavePix("111.444.777-35", "CPF")).toBe(true);
  });

  it("deve invalidar PIX CPF com dígitos repetidos", () => {
    expect(validarChavePix("111.111.111-11", "CPF")).toBe(false);
  });

  it("deve invalidar PIX CPF com tamanho errado", () => {
    expect(validarChavePix("123.456.789-0", "CPF")).toBe(false);
  });

  it("deve validar PIX EMAIL válido", () => {
    expect(validarChavePix("teste@example.com", "EMAIL")).toBe(true);
  });

  it("deve invalidar PIX EMAIL sem @", () => {
    expect(validarChavePix("testeexample.com", "EMAIL")).toBe(false);
  });

  it("deve validar PIX TELEFONE com 10+ dígitos", () => {
    expect(validarChavePix("11999999999", "TELEFONE")).toBe(true);
  });

  it("deve invalidar PIX TELEFONE curto", () => {
    expect(validarChavePix("119999999", "TELEFONE")).toBe(false);
  });
});

describe("utils - initialFormData", () => {
  it("deve retornar objeto com todos os campos vazios", () => {
    const form = initialFormData();
    expect(form.nomeFantasia).toBe("");
    expect(form.razaoSocial).toBe("");
    expect(form.cnpj).toBe("");
    expect(form.endereco).toBe("");
    expect(form.cidade).toBe("");
    expect(form.estado).toBe("");
    expect(form.telefone).toBe("");
    expect(form.email).toBe("");
    expect(form.responsavelNome).toBe("");
    expect(form.responsavelCpf).toBe("");
    expect(form.pixTipo).toBe("");
    expect(form.pixChave).toBe("");
    expect(form.bancoNome).toBe("");
    expect(form.agencia).toBe("");
    expect(form.conta).toBe("");
  });

  it("deve retornar um novo objeto a cada chamada", () => {
    const form1 = initialFormData();
    const form2 = initialFormData();
    expect(form1).not.toBe(form2);
    expect(form1).toEqual(form2);
  });
});