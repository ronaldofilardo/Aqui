import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@asa/database";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
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
        if (!credentials?.email || !credentials?.senha) return null;

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email as string },
          include: { consultor: true },
        });

        if (!user || user.status !== "ATIVO") return null;

        const senhaValida = await compare(
          credentials.senha as string,
          user.senhaHash,
        );
        if (!senhaValida) return null;

        return {
          id: user.id,
          name: user.nome,
          email: user.email,
          tipo: user.tipo,
          consultorId: user.consultor?.id || null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tipo = (user as any).tipo;
        token.consultorId = (user as any).consultorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).tipo = token.tipo;
        (session.user as any).consultorId = token.consultorId;
      }
      return session;
    },
  },
});
