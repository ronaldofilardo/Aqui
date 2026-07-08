import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@asa/database";
import { TipoAcesso } from "@/types/next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
            console.log("[auth] Missing email or password");
            return null;
          }

          const email = (credentials.email as string).toLowerCase().trim();

          const user = await prisma.usuario.findUnique({
            where: { email },
            include: {
              consultor: true,
              gestorPf: true,
              parceiro: true,
              comercial: true,
            },
          });

          if (user) {
            console.log(
              `[auth] Found usuario: ${email}, status: ${user.status}, tipo: ${user.tipo}, papel: ${user.papel}`
            );

            if (user.status !== "ATIVO" && user.status !== undefined) {
              console.log(`[auth] Status check failed: ${user.status}`);
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              user.senhaHash
            );

            if (senhaValida) {
              console.log(`[auth] ✓ Senha válida para ${email}`);
              
              return {
                id: user.id,
                name: user.nome,
                email: user.email,
                tipo: user.tipo as TipoAcesso,
                papel: user.papel,
                consultorId: user.consultor?.id ?? null,
                estabelecimentoId: null,
                gestorPfId: user.gestorPf?.id ?? null,
                parceiroId: user.parceiro?.id ?? null,
                comercialId: user.comercial?.id ?? null,
              };
            } else {
              console.log(`[auth] ✗ Senha inválida para ${email}`);
            }
          }

          const usuarioEstab = await prisma.usuarioEstabelecimento.findUnique({
            where: { email },
            include: {
              estabelecimento: { select: { id: true, nomeFantasia: true } },
            },
          });

          if (usuarioEstab) {
            console.log(
              `[auth] Found usuarioEstab: ${email}, ativo: ${usuarioEstab.ativo}`
            );

            if (usuarioEstab.ativo === false) {
              console.log(`[auth] UsuarioEstab inactive`);
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              usuarioEstab.senhaHash
            );

            if (senhaValida) {
              console.log(
                `[auth] ✓ Senha válida para estabelecimento ${email}`
              );
              return {
                id: usuarioEstab.id,
                name: usuarioEstab.nome,
                email: usuarioEstab.email,
                tipo: "ESTABELECIMENTO" as TipoAcesso,
                papel: null,
                consultorId: null,
                estabelecimentoId: usuarioEstab.estabelecimentoId,
                gestorPfId: null,
                parceiroId: null,
                comercialId: null,
              };
            } else {
              console.log(`[auth] ✗ Senha inválida para estabelecimento ${email}`);
            }
          }

          console.log(`[auth] Usuario não encontrado: ${email}`);
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
        token.gestorPfId = (user as any).gestorPfId;
        token.parceiroId = (user as any).parceiroId;
        token.comercialId = (user as any).comercialId;
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
        (session.user as any).gestorPfId = token.gestorPfId;
        (session.user as any).parceiroId = token.parceiroId;
        (session.user as any).comercialId = token.comercialId;
      }
      return session;
    },
  },
});