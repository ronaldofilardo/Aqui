import "next-auth";

export type TipoAcesso =
  | "ADMIN"
  | "GESTOR"
  | "GESTOR_PF"
  | "PARCEIRO"
  | "CONSULTOR"
  | "ESTABELECIMENTO";

declare module "next-auth" {
  interface User {
    tipo: TipoAcesso;
    consultorId: string | null;
    estabelecimentoId: string | null;
    gestorPfId: string | null;
    parceiroId: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tipo: TipoAcesso;
      consultorId: string | null;
      estabelecimentoId: string | null;
      gestorPfId: string | null;
      parceiroId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipo: TipoAcesso;
    consultorId: string | null;
    estabelecimentoId: string | null;
    gestorPfId: string | null;
    parceiroId: string | null;
  }
}
