import "next-auth";

declare module "next-auth" {
  interface User {
    tipo: "ADMIN" | "GESTOR" | "CONSULTOR";
    consultorId: string | null;
  }
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      tipo: "ADMIN" | "GESTOR" | "CONSULTOR";
      consultorId: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    tipo: "ADMIN" | "GESTOR" | "CONSULTOR";
    consultorId: string | null;
  }
}
