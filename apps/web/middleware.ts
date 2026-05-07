import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Security: Enforce HTTPS in production
// ---------------------------------------------------------------------------
function enforceHttpsProduction(req: NextRequest): NextResponse | null {
  // Only enforce in production
  if (process.env.NODE_ENV !== "production") {
    return null;
  }

  // x-forwarded-proto from Vercel is "https" (no colon); nextUrl.protocol is "https:"
  const proto = req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol;
  if (!proto.startsWith("https")) {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 301 });
  }

  return null;
}

// ---------------------------------------------------------------------------
// Allowed origins for CORS on /api/v1/* routes
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Enforce HTTPS in production
  const httpsResponse = enforceHttpsProduction(req);
  if (httpsResponse) {
    return httpsResponse;
  }

  const isApiV1 = pathname.startsWith("/api/v1/");

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
