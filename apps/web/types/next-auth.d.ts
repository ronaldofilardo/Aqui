import "next-auth";

export type PapelGestor = "BACKOFFICE" | "GESTOR_PJ" | "GESTOR_PF";

export type TipoAcesso =
  | "ADMIN"
  | "BACKOFFICE"
  | "SUPERVISAO"
  | "GERENCIA"
  | "GESTOR"
  | "CONSULTOR"
  | "PARCEIRO"
  | "COMERCIAL"
  | "LIDERANCA"
  | "ESTABELECIMENTO";

declare module "next-auth" {
  interface User {
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    consultorId: string | null;
    estabelecimentoId: string | null;
    backofficeId: string | null;
    parceiroId: string | null;
    comercialId: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tipo: TipoAcesso;
      papel: PapelGestor | null;
      consultorId: string | null;
      estabelecimentoId: string | null;
      backofficeId: string | null;
      parceiroId: string | null;
      comercialId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    consultorId: string | null;
    estabelecimentoId: string | null;
    backofficeId: string | null;
    parceiroId: string | null;
    comercialId: string | null;
  }
}
