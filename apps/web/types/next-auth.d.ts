import "next-auth";

export type TipoAcesso = "GESTOR" | "CONSULTOR" | "ESTABELECIMENTO";

declare module "next-auth" {
  interface User {
    tipo: TipoAcesso;
    consultorId: string | null;
    estabelecimentoId: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tipo: TipoAcesso;
      consultorId: string | null;
      estabelecimentoId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipo: TipoAcesso;
    consultorId: string | null;
    estabelecimentoId: string | null;
  }
}
