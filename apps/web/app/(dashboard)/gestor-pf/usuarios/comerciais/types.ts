export interface Comercial {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  percentualComissao: string | number;
  status: string;
  funcao?: string;
  telefone?: string | null;
  lideranca?: "COMERCIAL" | "GESTOR";
  tipoLideranca?: "COMERCIAL" | "GESTOR";
}

export interface Meta {
  id?: string;
  comercialId: string;
  mesReferencia: string;
  valorMeta: string | number;
  valorAtingido: string | number;
}

export interface Comissao {
  id?: string;
  comercialId: string;
  mesReferencia: string;
  valorVendas: string | number;
  valorComissao: string | number;
  status: string;
  dataPagamento?: string | null;
}

export interface RegrasComerciais {
  cartaoAcessoSaude: number;
  cireAtivo: number;
  cireReceptivo: number;
  franchisingAcesso: number;
  franchisingCartao: number;
  unidade: number;
}

export interface RegrasGestores {
  gerenteCire: number;
  supervisorAtivo: number;
  supervisorReceptivo: number;
  supervisorFranquia: number;
  supervisorAtendimento: number;
  gerenteAtendimento: number;
  supervisorComercial: number;
}

export type ActiveTab = "regras" | "cadastro" | "comissoes";

export interface ComercialEditando extends Comercial {
  editing?: boolean;
}