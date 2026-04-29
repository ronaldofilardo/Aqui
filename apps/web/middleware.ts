export { auth as middleware } from "./lib/auth-config";

// Protect dashboard routes, allow public/api/auth
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
