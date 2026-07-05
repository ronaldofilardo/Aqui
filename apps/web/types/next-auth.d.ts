import "next-auth";

export type PapelGestor = "GESTOR_PF" | "GESTOR_PJ";

export type TipoAcesso =
  | "ADMIN"
  | "GESTOR"
  | "GESTOR_PF"
  | "PARCEIRO"
  | "CONSULTOR"
  | "ESTABELECIMENTO"
  | "COMERCIAL";

declare module "next-auth" {
  interface User {
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    consultorId: string | null;
    estabelecimentoId: string | null;
    gestorPfId: string | null;
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
      gestorPfId: string | null;
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
    gestorPfId: string | null;
    parceiroId: string | null;
    comercialId: string | null;
  }
}
