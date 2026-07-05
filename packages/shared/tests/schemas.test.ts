import { describe, it, expect } from "vitest";
import {
  loginSchema,
  criarConsultorSchema,
  atualizarConsultorSchema,
  atualizarConsultorSelfSchema,
  criarEstabelecimentoSchema,
  criarCupomConfigSchema,
  agendarConsultaSchema,
  importarCuponsSchema,
  criarParceiroSchema,
  atualizarParceiroSchema,
  criarComercialSchema,
  atualizarComercialSchema,
  upsertMetaComercialSchema,
  preferenciaCicloParceiroSchema,
  validarCNPJ,
  validarCPF,
} from "../src/schemas";

describe("loginSchema", () => {
  it("deve validar login correto", () => {
    const result = loginSchema.safeParse({
      email: "admin@asa.com.br",
      senha: "admin123",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar email inválido", () => {
    const result = loginSchema.safeParse({ email: "invalid", senha: "123456" });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar senha curta", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", senha: "123" });
    expect(result.success).toBe(false);
  });
});

describe("criarConsultorSchema", () => {
  it("deve validar consultor válido", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "João",
      email: "joao@email.com",
      senha: "abc123",
      telefone: "11999999999",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar consultor com CPF válido", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Maria Silva",
      email: "maria@email.com",
      senha: "abc123",
      cpf: "529.982.247-25",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar CPF inválido no consultor", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Pedro",
      email: "pedro@email.com",
      senha: "abc123",
      cpf: "000.000.000-00",
    });
    expect(result.success).toBe(false);
  });

  it("deve aceitar consultor sem CPF", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Ana Souza",
      email: "ana@email.com",
      senha: "abc123",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar nome curto", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Jo",
      email: "j@e.com",
      senha: "abc123",
    });
    expect(result.success).toBe(false);
  });
});

describe("criarEstabelecimentoSchema", () => {
  it("deve validar dados de estabelecimento sem CNPJ", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Barbearia do João",
      email: "barbearia@email.com",
      cidade: "São Paulo",
      estado: "SP",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar CNPJ válido formatado", () => {
    // CNPJ válido: 11.222.333/0001-81
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Empresa X",
      cnpj: "11.222.333/0001-81",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar CNPJ válido somente dígitos", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Empresa Y",
      cnpj: "11222333000181",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar CNPJ inválido", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Empresa Z",
      cnpj: "12345678000199",
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toBe("CNPJ inválido");
  });

  it("deve rejeitar CNPJ com todos dígitos iguais", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Empresa W",
      cnpj: "11111111111111",
    });
    expect(result.success).toBe(false);
  });
});

describe("validarCNPJ", () => {
  it("deve validar CNPJ correto com máscara", () => {
    expect(validarCNPJ("11.222.333/0001-81")).toBe(true);
  });

  it("deve validar CNPJ correto sem máscara", () => {
    expect(validarCNPJ("11222333000181")).toBe(true);
  });

  it("deve rejeitar CNPJ com dígito verificador errado", () => {
    expect(validarCNPJ("11.222.333/0001-82")).toBe(false);
  });

  it("deve rejeitar CNPJ com todos dígitos iguais", () => {
    expect(validarCNPJ("00000000000000")).toBe(false);
    expect(validarCNPJ("11111111111111")).toBe(false);
  });

  it("deve rejeitar CNPJ com comprimento errado", () => {
    expect(validarCNPJ("1234567")).toBe(false);
  });
});

describe("criarCupomConfigSchema", () => {
  it("deve validar cupom config", () => {
    const result = criarCupomConfigSchema.safeParse({
      estabelecimentoId: "550e8400-e29b-41d4-a716-446655440000",
      codigoCupom: "A200",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar sem estabelecimentoId válido", () => {
    const result = criarCupomConfigSchema.safeParse({
      estabelecimentoId: "invalid",
      codigoCupom: "A200",
    });
    expect(result.success).toBe(false);
  });
});

describe("agendarConsultaSchema", () => {
  it("deve exigir cupomImportadoId como UUID válido", () => {
    const result = agendarConsultaSchema.safeParse({
      codigoCupom: "A200-001",
      cupomImportadoId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar sem cupomImportadoId", () => {
    const result = agendarConsultaSchema.safeParse({
      codigoCupom: "A200-001",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar cupomImportadoId inválido (não UUID)", () => {
    const result = agendarConsultaSchema.safeParse({
      codigoCupom: "A200-001",
      cupomImportadoId: "nao-e-um-uuid",
    });
    expect(result.success).toBe(false);
  });
});

describe("importarCuponsSchema", () => {
  it("deve validar mes e ano válidos", () => {
    const result = importarCuponsSchema.safeParse({
      mesReferencia: 3,
      anoReferencia: 2026,
    });
    expect(result.success).toBe(true);
  });

  it("deve validar primeiro e último mês", () => {
    expect(
      importarCuponsSchema.safeParse({ mesReferencia: 1, anoReferencia: 2025 })
        .success,
    ).toBe(true);
    expect(
      importarCuponsSchema.safeParse({ mesReferencia: 12, anoReferencia: 2025 })
        .success,
    ).toBe(true);
  });

  it("deve rejeitar mês inválido (0)", () => {
    const result = importarCuponsSchema.safeParse({
      mesReferencia: 0,
      anoReferencia: 2026,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar mês inválido (13)", () => {
    const result = importarCuponsSchema.safeParse({
      mesReferencia: 13,
      anoReferencia: 2026,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar ano antes de 2024", () => {
    const result = importarCuponsSchema.safeParse({
      mesReferencia: 1,
      anoReferencia: 2023,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar campos ausentes", () => {
    const result = importarCuponsSchema.safeParse({ mesReferencia: 3 });
    expect(result.success).toBe(false);
  });
});

describe("validarCPF", () => {
  it("deve validar CPF correto com máscara", () => {
    expect(validarCPF("530.511.739-91")).toBe(true);
  });

  it("deve validar CPF correto sem máscara", () => {
    expect(validarCPF("53051173991")).toBe(true);
  });

  it("deve rejeitar CPF com dígito verificador errado", () => {
    expect(validarCPF("530.511.739-92")).toBe(false);
  });

  it("deve rejeitar CPF com todos dígitos iguais", () => {
    expect(validarCPF("00000000000")).toBe(false);
    expect(validarCPF("11111111111")).toBe(false);
    expect(validarCPF("99999999999")).toBe(false);
  });

  it("deve rejeitar CPF com comprimento errado", () => {
    expect(validarCPF("1234567")).toBe(false);
    expect(validarCPF("123456789012")).toBe(false);
  });

  it("deve validar CPF com ou sem máscara (variações)", () => {
    // CPF válido: 530.511.739-91
    expect(validarCPF("530.511.739-91")).toBe(true);
    expect(validarCPF("53051173991")).toBe(true);
  });
});

describe("criarConsultorSchema com PIX", () => {
  it("deve validar consultor com PIX CPF", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "João Silva",
      email: "joao@email.com",
      senha: "abc123",
      telefone: "11999999999",
      pixTipo: "CPF",
      pixChave: "530.511.739-91",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar consultor com PIX EMAIL", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Maria",
      email: "maria@email.com",
      senha: "abc123",
      pixTipo: "EMAIL",
      pixChave: "maria@email.com",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar consultor com PIX TELEFONE", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Pedro",
      email: "pedro@email.com",
      senha: "abc123",
      pixTipo: "TELEFONE",
      pixChave: "11999999999",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar consultor com PIX CNPJ", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Empresa",
      email: "empresa@email.com",
      senha: "abc123",
      pixTipo: "CNPJ",
      pixChave: "11.222.333/0001-81",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar PIX CPF com formato inválido", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "João",
      email: "joao@email.com",
      senha: "abc123",
      pixTipo: "CPF",
      pixChave: "000.000.000-00",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar PIX EMAIL com formato inválido", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Maria",
      email: "maria@email.com",
      senha: "abc123",
      pixTipo: "EMAIL",
      pixChave: "invalid-email",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar PIX TELEFONE com menos de 10 dígitos", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "Pedro",
      email: "pedro@email.com",
      senha: "abc123",
      pixTipo: "TELEFONE",
      pixChave: "123456",
    });
    expect(result.success).toBe(false);
  });
});

describe("criarEstabelecimentoSchema com dados bancários", () => {
  it("deve validar estabelecimento com PIX CPF", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Barbearia do João",
      cnpj: "11.222.333/0001-81",
      pixTipo: "CPF",
      pixChave: "530.511.739-91",
      bancoNome: "Bradesco",
      agencia: "1234",
      conta: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar estabelecimento com PIX CNPJ", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Salão de Beleza",
      pixTipo: "CNPJ",
      pixChave: "11.222.333/0001-81",
      bancoNome: "Itaú",
      agencia: "5678",
      conta: "654321",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar estabelecimento com PIX EMAIL", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Padaria Central",
      pixTipo: "EMAIL",
      pixChave: "contato@padaria.com.br",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar estabelecimento com PIX TELEFONE", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Restaurante X",
      pixTipo: "TELEFONE",
      pixChave: "11987654321",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar estabelecimento com dados bancários parciais", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Clínica Y",
      bancoNome: "Banco do Brasil",
      agencia: "9999",
      conta: "999999",
    });
    expect(result.success).toBe(true);
  });

  it("deve validar estabelecimento sem dados bancários", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Consultório Z",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar PIX CPF inválido no estabelecimento", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Negócio",
      pixTipo: "CPF",
      pixChave: "000.000.000-00",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar PIX CNPJ inválido no estabelecimento", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Loja",
      pixTipo: "CNPJ",
      pixChave: "11111111111111",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar PIX EMAIL inválido no estabelecimento", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Oficina",
      pixTipo: "EMAIL",
      pixChave: "email-invalido@",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar PIX TELEFONE com menos de 10 dígitos no estabelecimento", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Loja",
      pixTipo: "TELEFONE",
      pixChave: "123",
    });
    expect(result.success).toBe(false);
  });

  it("deve aceitar PIX sem banco/agencia/conta", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Comércie",
      pixTipo: "EMAIL",
      pixChave: "vendas@comerce.com",
      bancoNome: undefined,
      agencia: undefined,
      conta: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar banco/agencia/conta sem PIX", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Indústria",
      bancoNome: "Caixa",
      agencia: "3333",
      conta: "333333",
      pixTipo: undefined,
      pixChave: undefined,
    });
    expect(result.success).toBe(true);
  });
});

describe("pixChave min(1) — rejeitar string vazia", () => {
  it("deve rejeitar pixChave vazia em criarConsultorSchema", () => {
    const result = criarConsultorSchema.safeParse({
      nome: "João Silva",
      email: "joao@email.com",
      senha: "abc123",
      pixChave: "",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar pixChave vazia em criarEstabelecimentoSchema", () => {
    const result = criarEstabelecimentoSchema.safeParse({
      nomeFantasia: "Loja",
      pixChave: "",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar pixChave vazia em atualizarConsultorSchema", () => {
    const result = atualizarConsultorSchema.safeParse({ pixChave: "" });
    expect(result.success).toBe(false);
  });
});

describe("atualizarConsultorSelfSchema — não permite status", () => {
  it("deve aceitar atualização de nome sem status", () => {
    const result = atualizarConsultorSelfSchema.safeParse({
      nome: "Novo Nome",
    });
    expect(result.success).toBe(true);
  });

  it("deve ignorar/rejeitar campo status na atualização própria", () => {
    // O omit torna status um campo desconhecido — Zod por padrão faz strip
    const result = atualizarConsultorSelfSchema.safeParse({
      nome: "Novo Nome",
      status: "INATIVO",
    });
    expect(result.success).toBe(true);
    // O campo status não deve estar no output (stripped por Zod)
    expect((result.data as Record<string, unknown>).status).toBeUndefined();
  });
});

// ============================================================================
// Schemas para Parceiro (campos legados opcionais)
// ============================================================================
describe("criarParceiroSchema", () => {
  it("deve aceitar parceiro sem percentualComissao (legado, opcional)", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Carlos Parceiro",
      email: "carlos@email.com",
      cpf: "530.511.739-91",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar parceiro com percentualComissao válido", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Carlos Parceiro",
      email: "carlos@email.com",
      cpf: "530.511.739-91",
      percentualComissao: "5.5",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar percentualComissao como número", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Carlos",
      email: "carlos@email.com",
      cpf: "530.511.739-91",
      percentualComissao: 12.34,
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar percentualComissao acima de 100", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Carlos",
      email: "carlos@email.com",
      cpf: "530.511.739-91",
      percentualComissao: "150",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar percentualComissao negativo", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Carlos",
      email: "carlos@email.com",
      cpf: "530.511.739-91",
      percentualComissao: "-1",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar CPF inválido", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Carlos",
      email: "carlos@email.com",
      cpf: "000.000.000-00",
    });
    expect(result.success).toBe(false);
  });

  it("deve aceitar pixChave opcional", () => {
    const result = criarParceiroSchema.safeParse({
      nome: "Carlos",
      email: "carlos@email.com",
      cpf: "530.511.739-91",
      pixChave: "carlos@email.com",
    });
    expect(result.success).toBe(true);
  });
});

describe("atualizarParceiroSchema", () => {
  it("deve exigir id (UUID)", () => {
    const result = atualizarParceiroSchema.safeParse({
      nome: "Carlos",
    });
    expect(result.success).toBe(false);
  });

  it("deve aceitar UUID válido", () => {
    const result = atualizarParceiroSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      nome: "Atualizado",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar atualizar status", () => {
    const result = atualizarParceiroSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "DESLIGADO",
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// Schemas para Comercial
// ============================================================================
describe("criarComercialSchema", () => {
  it("deve validar comercial com dados mínimos obrigatórios", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Mariana Comercial",
      email: "mariana@empresa.com",
      cpf: "530.511.739-91",
      percentualComissao: 2.5,
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar percentual como string numérica", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Mariana",
      email: "mariana@empresa.com",
      cpf: "530.511.739-91",
      percentualComissao: "3.5",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar telefone opcional", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Mariana",
      email: "mariana@empresa.com",
      cpf: "530.511.739-91",
      telefone: "11999998888",
      percentualComissao: 1,
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar percentual acima de 100", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Mariana",
      email: "mariana@empresa.com",
      cpf: "530.511.739-91",
      percentualComissao: 200,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar percentual negativo", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Mariana",
      email: "mariana@empresa.com",
      cpf: "530.511.739-91",
      percentualComissao: -1,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar CPF inválido", () => {
    const result = criarComercialSchema.safeParse({
      nome: "X",
      email: "x@y.com",
      cpf: "12345678900",
      percentualComissao: 1,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar email inválido", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Mariana",
      email: "email-sem-arroba",
      cpf: "530.511.739-91",
      percentualComissao: 1,
    });
    expect(result.success).toBe(false);
  });

  it("deve aceitar sem percentualComissao (opcional)", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Mariana",
      email: "mariana@empresa.com",
      cpf: "530.511.739-91",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar nome curto", () => {
    const result = criarComercialSchema.safeParse({
      nome: "Ma",
      email: "mariana@empresa.com",
      cpf: "530.511.739-91",
      percentualComissao: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe("atualizarComercialSchema", () => {
  it("deve aceitar atualização vazia (sem campos)", () => {
    const result = atualizarComercialSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("deve aceitar apenas nome", () => {
    const result = atualizarComercialSchema.safeParse({
      nome: "Novo Nome",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar percentual válido", () => {
    const result = atualizarComercialSchema.safeParse({
      percentualComissao: 7.25,
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar status inválido", () => {
    const result = atualizarComercialSchema.safeParse({
      status: "PAUSA",
    });
    expect(result.success).toBe(false);
  });

  it("deve aceitar status válidos (ATIVO/INATIVO)", () => {
    expect(
      atualizarComercialSchema.safeParse({ status: "ATIVO" }).success,
    ).toBe(true);
    expect(
      atualizarComercialSchema.safeParse({ status: "INATIVO" }).success,
    ).toBe(true);
  });
});

describe("upsertMetaComercialSchema", () => {
  it("deve validar meta válida", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2026-07",
      valorMeta: "1500.00",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar valorMeta como número", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2026-07",
      valorMeta: 5000,
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar valorMeta = 0", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2026-07",
      valorMeta: 0,
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar valorMeta negativo", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "2026-07",
      valorMeta: "-100",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar mesReferencia em formato inválido", () => {
    const result = upsertMetaComercialSchema.safeParse({
      mesReferencia: "07-2026",
      valorMeta: 100,
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar mesReferencia ausente", () => {
    const result = upsertMetaComercialSchema.safeParse({
      valorMeta: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("preferenciaCicloParceiroSchema", () => {
  it("deve aceitar SEMESTRAL", () => {
    const result = preferenciaCicloParceiroSchema.safeParse({
      periodicidade: "SEMESTRAL",
    });
    expect(result.success).toBe(true);
  });

  it("deve aceitar ANUAL", () => {
    const result = preferenciaCicloParceiroSchema.safeParse({
      periodicidade: "ANUAL",
    });
    expect(result.success).toBe(true);
  });

  it("deve rejeitar valor fora do enum", () => {
    const result = preferenciaCicloParceiroSchema.safeParse({
      periodicidade: "TRIMESTRAL",
    });
    expect(result.success).toBe(false);
  });

  it("deve rejeitar periodicidade ausente", () => {
    const result = preferenciaCicloParceiroSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
