import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// Lightweight auth config for middleware (no Prisma, no bcryptjs)
// All actual authentication happens server-side in lib/auth.ts
export const { handlers: middlewareHandlers, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize() {
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token }) {
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
