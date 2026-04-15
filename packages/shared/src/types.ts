export type TipoUsuario = "GESTOR" | "CONSULTOR";
export type TipoPix = "CPF" | "CNPJ" | "EMAIL" | "TELEFONE";
export type TipoDocumento = "CNPJ" | "CPF_RESPONSAVEL";
export type StatusCupomImportado =
  | "DISPONIVEL"
  | "USADO"
  | "CANCELADO"
  | "EXPIRADO";
export type StatusConsulta =
  | "AGENDADA"
  | "REALIZADA"
  | "CANCELADA"
  | "NAO_COMPARECEU";
export type StatusPagamentoComissao = "PENDENTE" | "PAGO" | "CANCELADO";
export type StatusPagamento = "PENDENTE" | "PROCESSANDO" | "PAGO" | "FALHOU";

export interface CupomImportadoLinha {
  nomeCupom: string;
  paciente: string;
  campanha: string;
  local: string;
  servico: string;
  preco: number;
  desconto: number;
  agendamento: Date;
  recurso: string;
  cpf: string;
}

export interface ImportacaoErro {
  linha: number;
  campo: string;
  mensagem: string;
}

export interface ImportacaoResultado {
  totalLinhas: number;
  importados: number;
  erros: ImportacaoErro[];
  dados: CupomImportadoLinha[];
}
