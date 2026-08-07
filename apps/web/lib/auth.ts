import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@aqui/database";
import { TipoAcesso } from "@/types/next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js v5 exige trustHost=true quando o app está atrás de proxy / domínio custom
  // (Vercel + asaqui.acessosaude.com.br). Sem isso, validações de host/CSRF falham.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.senha) {
            return null;
          }

          const email = (credentials.email as string).toLowerCase().trim();

          const user = await prisma.usuario.findUnique({
            where: { email },
            include: {
              consultor: true,
            },
          });

          if (user) {
            if (user.status !== "ATIVO" && user.status !== undefined) {
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              user.senhaHash,
            );

            if (senhaValida) {
              const papelShadow =
                user.tipo === "GESTOR_PJ" ? ("GESTOR_PJ" as const) : null;

              return {
                id: user.id,
                name: user.nome,
                email: user.email,
                tipo: user.tipo as TipoAcesso,
                papel: papelShadow,
                consultorId: user.consultor?.id ?? null,
                estabelecimentoId: null,
              };
            }
          }

          const usuarioEstab = await prisma.usuarioEstabelecimento.findUnique({
            where: { email },
            include: {
              estabelecimento: { select: { id: true, nomeFantasia: true } },
            },
          });

          if (usuarioEstab) {
            if (usuarioEstab.ativo === false) {
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              usuarioEstab.senhaHash,
            );

            if (senhaValida) {
              return {
                id: usuarioEstab.id,
                name: usuarioEstab.nome,
                email: usuarioEstab.email,
                tipo: "ESTABELECIMENTO" as TipoAcesso,
                papel: null,
                consultorId: null,
                estabelecimentoId: usuarioEstab.estabelecimentoId,
              };
            }
          }

          return null;
        } catch (error) {
          console.error("[auth] Error in authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        token.tipo = (user as any).tipo;
        token.papel = (user as any).papel;
        token.consultorId = (user as any).consultorId;
        token.estabelecimentoId = (user as any).estabelecimentoId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tipo = token.tipo;
        (session.user as any).papel = token.papel;
        (session.user as any).consultorId = token.consultorId;
        (session.user as any).estabelecimentoId = token.estabelecimentoId;
      }
      return session;
    },
  },
});
