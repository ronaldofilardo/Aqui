import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

function enforceHttpsProduction(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol;
  if (!proto.startsWith("https")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

  return null;
}

function getAllowedOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000"
  );
}

function buildCorsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

type SessionUser = {
  tipo?: string;
  papel?: string | null;
};

const ROUTE_RULES: Array<{
  prefix: string;
  allowedTipos: string[];
  allowedPapeis?: Array<string | null>;
}> = [
  { prefix: "/admin", allowedTipos: ["ADMIN"] },
  { prefix: "/gestor", allowedTipos: ["GESTOR_PJ"], allowedPapeis: ["GESTOR_PJ"] },
  { prefix: "/consultor", allowedTipos: ["CONSULTOR"] },
  { prefix: "/estabelecimento", allowedTipos: ["ESTABELECIMENTO"] },
];

function dashboardForPapel(user: SessionUser): string {
  if (user.tipo === "ADMIN") return "/admin/usuarios";
  if (user.tipo === "GESTOR_PJ") return "/gestor/dashboard";
  if (user.tipo === "CONSULTOR") return "/consultor/estabelecimentos";
  if (user.tipo === "ESTABELECIMENTO") return "/estabelecimento/dashboard";
  return "/login";
}

function authorizeByPapel(
  req: NextRequest,
  user: SessionUser,
): NextResponse | null {
  const { pathname } = req.nextUrl;

  const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return null;

  const isAuthorized =
    !!user.tipo &&
    rule.allowedTipos.includes(user.tipo) &&
    (rule.allowedPapeis === undefined ||
      rule.allowedPapeis.includes(user.papel ?? null));

  if (isAuthorized) return null;

  const url = req.nextUrl.clone();
  url.pathname = dashboardForPapel(user);
  url.searchParams.set("error", "permission_denied");
  return NextResponse.redirect(url);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const httpsResponse = enforceHttpsProduction(req);
  if (httpsResponse) {
    return httpsResponse;
  }

  const isApiV1 = pathname.startsWith("/api/v1/");

  if (isApiV1) {
    const allowedOrigin = getAllowedOrigin();
    const requestOrigin = req.headers.get("origin") ?? "";

    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: buildCorsHeaders(allowedOrigin),
      });
    }

    if (
      requestOrigin &&
      allowedOrigin &&
      requestOrigin !== allowedOrigin &&
      !requestOrigin.startsWith("http://localhost")
    ) {
      return NextResponse.json(
        { error: "Origem nao permitida" },
        { status: 403 },
      );
    }
  }

  const protectedPrefixes = ROUTE_RULES.map((r) => r.prefix);
  if (
    protectedPrefixes.some((p) => pathname.startsWith(p)) &&
    !pathname.startsWith("/api/")
  ) {
    // O nome do cookie e usado como "salt" na derivacao da chave (HKDF) do JWT
    // no Auth.js v5. Portanto, ler com um nome diferente do usado na assinatura
    // faz o decode falhar silenciosamente (token = null) e gera loop de login.
    //
    // Na Vercel o TLS termina no proxy: a request que chega na funcao e "http:",
    // entao o Auth.js so assina o cookie com prefixo "__Secure-" se AUTH_URL /
    // NEXTAUTH_URL estiver definido com https. Por isso derivamos o nome do
    // cookie da MESMA fonte, em vez de assumir NODE_ENV === "production".
    const authUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
    const useSecureCookie = authUrl?.startsWith("https://") ?? false;

    const token = await getToken({
      req,
      secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
      secureCookie: useSecureCookie,
    });

    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    const user: SessionUser = {
      tipo: token.tipo as string | undefined,
      papel: (token as any).papel ?? null,
    };

    const deny = authorizeByPapel(req, user);
    if (deny) return deny;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
