import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth-config";

// ---------------------------------------------------------------------------
// Security: Enforce HTTPS in production
// ---------------------------------------------------------------------------
function enforceHttpsProduction(req: NextRequest): NextResponse | null {
  // Only enforce in production
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  // Check if request is not HTTPS
  const protocol = req.headers.get("x-forwarded-proto") || req.nextUrl.protocol;
  if (protocol !== "https:") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  return null;
}

// ---------------------------------------------------------------------------
// Allowed origins for CORS on /api/v1/* routes
// ---------------------------------------------------------------------------
function getAllowedOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
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

// ---------------------------------------------------------------------------
// Protected Routes (require authentication)
// ---------------------------------------------------------------------------
const protectedRoutes = [
  "/gestor",
  "/consultor",
  "/estabelecimento",
  "/admin",
  "/rh",
  "/api/v1/gestor",
  "/api/v1/consultor",
  "/api/v1/estabelecimento",
  "/api/v1/admin",
];

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Enforce HTTPS in production
  const httpsResponse = enforceHttpsProduction(req);
  if (httpsResponse) {
    return httpsResponse;
  }

  const isApiV1 = pathname.startsWith("/api/v1/");
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // ------ CORS ---------------------------------------------------------------
  if (isApiV1) {
    const allowedOrigin = getAllowedOrigin();
    const requestOrigin = req.headers.get("origin") ?? "";

    // Preflight
    if (req.method === "OPTIONS") {
      return new NextResponse(null, {
        status: 204,
        headers: buildCorsHeaders(allowedOrigin),
      });
    }

    // Block cross-origin requests from unknown origins (only when an origin
    // header is present — same-origin server-to-server calls have no origin).
    if (
      requestOrigin &&
      allowedOrigin &&
      requestOrigin !== allowedOrigin &&
      !requestOrigin.startsWith("http://localhost")
    ) {
      return NextResponse.json(
        { error: "Origem não permitida" },
        { status: 403 },
      );
    }
  }

  // ------ Auth guard for protected routes ----
  if (isProtected) {
    const session = await auth();
    if (!session) {
      // Redirect to login preserving the original URL
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ------ Redirect authenticated users away from login page ----
  if (pathname === "/login") {
    const session = await auth();
    if (session) {
      // User is already logged in, redirect to dashboard based on tipo
      const userType = (session.user as any)?.tipo;
      const dashboards: Record<string, string> = {
        GESTOR: "/gestor/dashboard",
        CONSULTOR: "/consultor/dashboard",
        ESTABELECIMENTO: "/estabelecimento/dashboard",
        ADMIN: "/admin/dashboard",
      };
      const redirectUrl = dashboards[userType] || "/";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/gestor/:path*",
    "/consultor/:path*",
    "/estabelecimento/:path*",
    "/api/v1/gestor/:path*",
    "/api/v1/consultor/:path*",
    "/api/v1/estabelecimento/:path*",
  ],
};
