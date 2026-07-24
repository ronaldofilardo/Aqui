import "next-auth";

export type PapelGestor = "GESTOR_PJ";

export type TipoAcesso =
  | "ADMIN"
  | "CONSULTOR"
  | "GESTOR_PJ"
  | "ESTABELECIMENTO";

declare module "next-auth" {
  interface User {
    tipo: TipoAcesso;
    papel: PapelGestor | null;
    consultorId: string | null;
    estabelecimentoId: string | null;
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
  }
}
