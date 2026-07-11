import { z } from "zod";

function validarCNPJ(cnpj: string): boolean {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false;
  const calc = (len: number): number => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
}

function validarCPF(cpf: string): boolean {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false;
  const calc = (len: number): number => {
    let sum = 0;
    let pos = len + 1;
    for (let i = 0; i < len; i++) {
      sum += parseInt(d[i]) * pos--;
    }
    return sum % 11 < 2 ? 0 : 11 - (sum % 11);
  };
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10]);
}

export { validarCNPJ, validarCPF };

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

export const criarConsultorSchema = z
  .object({
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    email: z.string().email("Email inválido"),
    cpf: z
      .string()
      .optional()
      .refine((val) => !val || validarCPF(val), { message: "CPF inválido" }),
    telefone: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val ||
          /^[\d\s\-\(\)]+$/.test(val) ||
          val.replace(/\D/g, "").length >= 10,
        { message: "Telefone inválido" },
      ),
    pixChave: z.string().min(1).optional(),
    pixTipo: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE"]).optional(),
    bancoNome: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.pixChave || !data.pixTipo) return true;
      const chave = data.pixChave.replace(/\D/g, "");
      if (data.pixTipo === "CPF") return validarCPF(data.pixChave);
      if (data.pixTipo === "CNPJ") return validarCNPJ(data.pixChave);
      if (data.pixTipo === "EMAIL")
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixChave);
      if (data.pixTipo === "TELEFONE") return chave.length >= 10;
      return true;
    },
    {
      message: "Chave PIX inválida para o tipo selecionado",
      path: ["pixChave"],
    },
  );

const atualizarConsultorBaseSchema = z.object({
  nome: z.string().min(3).optional(),
  telefone: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        /^[\d\s\-\(\)]+$/.test(val) ||
        val.replace(/\D/g, "").length >= 10,
      { message: "Telefone inválido" },
    ),
  pixChave: z.string().min(1).optional(),
  pixTipo: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE"]).optional(),
  bancoNome: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

const pixValidation = (data: { pixChave?: string; pixTipo?: string }) => {
  if (!data.pixChave || !data.pixTipo) return true;
  if (data.pixTipo === "CPF") return validarCPF(data.pixChave);
  if (data.pixTipo === "CNPJ") return validarCNPJ(data.pixChave);
  if (data.pixTipo === "EMAIL")
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixChave);
  if (data.pixTipo === "TELEFONE")
    return data.pixChave.replace(/\D/g, "").length >= 10;
  return true;
};

export const atualizarConsultorSchema = atualizarConsultorBaseSchema.refine(
  pixValidation,
  {
    message: "Chave PIX inválida para o tipo selecionado",
    path: ["pixChave"],
  },
);

// Schema para self-update: exclui o campo status (consultor não pode se auto-desativar/ativar)
export const atualizarConsultorSelfSchema = atualizarConsultorBaseSchema
  .omit({ status: true })
  .refine(pixValidation, {
    message: "Chave PIX inválida para o tipo selecionado",
    path: ["pixChave"],
  });

export const criarEstabelecimentoSchema = z
  .object({
    nomeFantasia: z.string().min(2, "Nome fantasia é obrigatório"),
    razaoSocial: z.string().optional(),
    cnpj: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || val.replace(/\D/g, "").length === 0 || validarCNPJ(val),
        { message: "CNPJ inválido" },
      ),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().length(2).optional(),
    telefone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    responsavelNome: z.string().optional(),
    responsavelCpf: z.string().optional(),
    pixChave: z.string().min(1).optional(),
    pixTipo: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE"]).optional(),
    bancoNome: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.pixChave || !data.pixTipo) return true;
      if (data.pixTipo === "CPF") return validarCPF(data.pixChave);
      if (data.pixTipo === "CNPJ") return validarCNPJ(data.pixChave);
      if (data.pixTipo === "EMAIL")
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixChave);
      if (data.pixTipo === "TELEFONE")
        return data.pixChave.replace(/\D/g, "").length >= 10;
      return true;
    },
    {
      message: "Chave PIX inválida para o tipo selecionado",
      path: ["pixChave"],
    },
  );

export const atualizarEstabelecimentoSchema = z
  .object({
    nomeFantasia: z.string().min(2).optional(),
    razaoSocial: z.string().optional(),
    cnpj: z
      .string()
      .optional()
      .refine(
        (val) =>
          !val || val.replace(/\D/g, "").length === 0 || validarCNPJ(val),
        { message: "CNPJ inválido" },
      ),
    endereco: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().length(2).optional(),
    telefone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    responsavelNome: z.string().optional(),
    responsavelCpf: z.string().optional(),
    pixChave: z.string().min(1).optional(),
    pixTipo: z.enum(["CPF", "CNPJ", "EMAIL", "TELEFONE"]).optional(),
    bancoNome: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
    status: z.enum(["ATIVO", "INATIVO"]).optional(),
  })
  .refine(
    (data) => {
      if (!data.pixChave || !data.pixTipo) return true;
      if (data.pixTipo === "CPF") return validarCPF(data.pixChave);
      if (data.pixTipo === "CNPJ") return validarCNPJ(data.pixChave);
      if (data.pixTipo === "EMAIL")
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.pixChave);
      if (data.pixTipo === "TELEFONE")
        return data.pixChave.replace(/\D/g, "").length >= 10;
      return true;
    },
    {
      message: "Chave PIX inválida para o tipo selecionado",
      path: ["pixChave"],
    },
  );

export const criarCupomConfigSchema = z.object({
  estabelecimentoId: z.string().uuid("ID do estabelecimento inválido"),
  codigoCupom: z.string().min(1, "Código do cupom é obrigatório").max(50),
  descricao: z.string().optional(),
});

export const importarCuponsSchema = z.object({
  mesReferencia: z.number().int().min(1).max(12),
  anoReferencia: z.number().int().min(2024).max(2100),
});

export const agendarConsultaSchema = z.object({
  codigoCupom: z.string().min(1, "Código do cupom é obrigatório"),
  cupomImportadoId: z.string().uuid("ID do cupom importado inválido"),
  dataAgendamento: z.string().datetime().optional(),
});

export const atualizarConsultaSchema = z.object({
  status: z.enum(["AGENDADA", "REALIZADA", "CANCELADA", "NAO_COMPARECEU"]),
  valorPago: z.number().positive().optional(),
});

export const processarPagamentosSchema = z.object({
  mesReferencia: z.number().int().min(1).max(12),
  anoReferencia: z.number().int().min(2024).max(2100),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CriarConsultorInput = z.infer<typeof criarConsultorSchema>;
export type AtualizarConsultorInput = z.infer<typeof atualizarConsultorSchema>;
export type AtualizarConsultorSelfInput = z.infer<
  typeof atualizarConsultorSelfSchema
>;
export type CriarEstabelecimentoInput = z.infer<
  typeof criarEstabelecimentoSchema
>;
export type AtualizarEstabelecimentoInput = z.infer<
  typeof atualizarEstabelecimentoSchema
>;
export type CriarCupomConfigInput = z.infer<typeof criarCupomConfigSchema>;
export type ImportarCuponsInput = z.infer<typeof importarCuponsSchema>;
export type AgendarConsultaInput = z.infer<typeof agendarConsultaSchema>;
export type AtualizarConsultaInput = z.infer<typeof atualizarConsultaSchema>;
export type ProcessarPagamentosInput = z.infer<
  typeof processarPagamentosSchema
>;

export const indicarClienteSchema = z.object({
  cpfParceiro: z
    .string()
    .refine((val) => validarCPF(val), { message: "CPF do Parceiro inválido" }),
  cpfIndicado: z
    .string()
    .refine((val) => validarCPF(val), { message: "CPF do Indicado inválido" }),
  nomeIndicado: z
    .string()
    .min(3, "Nome do indicado deve ter no mínimo 3 caracteres"),
  telefoneIndicado: z.string().optional(),
});

export const criarGestorPFSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  percentualComissaoDefault: z.number().min(0).max(100).optional(),
  percentualComissaoMax: z.number().min(0).max(100).optional(),
});

export const criarParceiroSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  pixChave: z.string().optional(),
  telefone: z.string().optional(),
});

export const atualizarParceiroSchema = z.object({
  id: z.string().uuid("ID inválido"),
  nome: z.string().min(3).optional(),
  pixChave: z.string().optional(),
  status: z.enum(["ATIVO", "DESLIGADO"]).optional(),
});

export const desligarParceiroSchema = z.object({
  confirmar: z.literal(true),
});

export const atualizarGestorPFSchema = z.object({
  nome: z.string().min(3).optional(),
  percentualComissaoDefault: z.number().min(0).max(100).optional(),
  percentualComissaoMax: z.number().min(0).max(100).optional(),
});

export const cadastrarIndicadoSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  telefone: z.string().optional(),
});

export const processarPlanilhaSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
});

export const criarComercialSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("Email inválido"),
  cpf: z.string().refine((val) => validarCPF(val), { message: "CPF inválido" }),
  telefone: z.string().optional(),
  percentualComissao: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return num >= 0 && num <= 100;
      },
      { message: "Deve estar entre 0 e 100" },
    )
    .optional(),
  funcao: z.enum([
    "GERENTE_CIRE",
    "SUPERVISOR_ATIVO",
    "SUPERVISOR_RECEPTIVO",
    "SUPERVISOR_FRANQUIA",
    "SUPERVISOR_ATENDIMENTO",
    "GERENTE_ATENDIMENTO",
    "SUPERVISOR_COMERCIAL",
  ]).optional(),
});

export const atualizarComercialSchema = z.object({
  nome: z.string().min(3).optional(),
  email: z.string().email().optional(),
  cpf: z.string().optional(),
  telefone: z.string().optional(),
  funcao: z.string().optional(),
  lideranca: z.enum(["COMERCIAL", "GESTOR"]).optional(),
  percentualComissao: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return num >= 0 && num <= 100;
      },
      { message: "Deve estar entre 0 e 100" },
    )
    .optional(),
  status: z.enum(["ATIVO", "INATIVO"]).optional(),
});

export const upsertMetaComercialSchema = z.object({
  mesReferencia: z.string().regex(/^\d{4}-\d{2}$/, "Formato: YYYY-MM"),
  valorMeta: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return num >= 0;
      },
      { message: "Valor da meta deve ser >= 0" },
    ),
});

export const preferenciaCicloParceiroSchema = z.object({
  periodicidade: z.enum(["SEMESTRAL", "ANUAL"]),
});

export type IndicarClienteInput = z.infer<typeof indicarClienteSchema>;
export type CriarGestorPFInput = z.infer<typeof criarGestorPFSchema>;
export type CriarParceiroInput = z.infer<typeof criarParceiroSchema>;
export type AtualizarParceiroInput = z.infer<typeof atualizarParceiroSchema>;
export type DesligarParceiroInput = z.infer<typeof desligarParceiroSchema>;
export type AtualizarGestorPFInput = z.infer<typeof atualizarGestorPFSchema>;
export type CadastrarIndicadoInput = z.infer<typeof cadastrarIndicadoSchema>;
export type ProcessarPlanilhaInput = z.infer<typeof processarPlanilhaSchema>;
export type CriarComercialInput = z.infer<typeof criarComercialSchema>;
export type AtualizarComercialInput = z.infer<typeof atualizarComercialSchema>;
export type UpsertMetaComercialInput = z.infer<typeof upsertMetaComercialSchema>;
export type PreferenciaCicloParceiroInput = z.infer<
  typeof preferenciaCicloParceiroSchema
>;
