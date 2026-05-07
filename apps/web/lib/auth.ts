import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@asa/database";

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

          // Tenta autenticar como usuário do sistema (Admin/Gestor/Consultor)
          const user = await prisma.usuario.findUnique({
            where: { email },
            include: { consultor: true },
          });

          if (user) {
            console.log(`[auth] Found usuario: ${email}, status: ${user.status}, tipo: ${user.tipo}`);
            
            // Permitir ATIVO ou sem status definido (para compatibilidade)
            if (user.status !== "ATIVO" && user.status !== undefined) {
              console.log(`[auth] Status check failed: ${user.status}`);
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              user.senhaHash,
            );
            
            if (senhaValida) {
              console.log(`[auth] ✓ Senha válida para ${email}`);
              return {
                id: user.id,
                name: user.nome,
                email: user.email,
                tipo: user.tipo as "ADMIN" | "GESTOR" | "CONSULTOR",
                consultorId: user.consultor?.id || null,
                estabelecimentoId: null,
              };
            } else {
              console.log(`[auth] ✗ Senha inválida para ${email}`);
            }
          }

          // Tenta autenticar como usuário de estabelecimento
          const usuarioEstab = await prisma.usuarioEstabelecimento.findUnique({
            where: { email },
            include: {
              estabelecimento: { select: { id: true, nomeFantasia: true } },
            },
          });

          if (usuarioEstab) {
            console.log(`[auth] Found usuarioEstab: ${email}, ativo: ${usuarioEstab.ativo}`);
            
            // Permitir ativo=true ou sem status definido (para compatibilidade)
            if (usuarioEstab.ativo === false) {
              console.log(`[auth] UsuarioEstab inactive`);
              return null;
            }

            const senhaValida = await compare(
              credentials.senha as string,
              usuarioEstab.senhaHash,
            );
            
            if (senhaValida) {
              console.log(`[auth] ✓ Senha válida para estabelecimento ${email}`);
              return {
                id: usuarioEstab.id,
                name: usuarioEstab.nome,
                email: usuarioEstab.email,
                tipo: "ESTABELECIMENTO" as const,
                consultorId: null,
                estabelecimentoId: usuarioEstab.estabelecimentoId,
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
        token.id = user.id;
        token.tipo = (user as any).tipo;
        token.consultorId = (user as any).consultorId;
        token.estabelecimentoId = (user as any).estabelecimentoId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tipo = token.tipo;
        (session.user as any).consultorId = token.consultorId;
        (session.user as any).estabelecimentoId = token.estabelecimentoId;
      }
      return session;
    },
  },
});
