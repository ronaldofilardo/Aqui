export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function gerarSenhaProvisoria(cpf: string): string {
  const cpfClean = cpf.replace(/\D/g, "");
  return cpfClean.substring(0, 5);
}

export function getBaseUrl(req?: {
  nextUrl?: { protocol: string; host: string };
}): string {
  let baseUrl = "";

  // Priority 1: NEXTAUTH_URL (explicitly configured)
  if (process.env.NEXTAUTH_URL) {
    baseUrl = process.env.NEXTAUTH_URL;
  }
  // Priority 2: Request nextUrl
  else if (req?.nextUrl?.host && req?.nextUrl?.protocol) {
    baseUrl = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  }
  // Priority 3: VERCEL_URL (auto-detected in Vercel)
  else if (process.env.VERCEL_URL) {
    baseUrl = `https://${process.env.VERCEL_URL}`;
  }
  // Priority 4: Dev fallback
  else {
    baseUrl = "http://localhost:3000";
  }

  // Ensure no trailing slash and no protocol duplication
  baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash

  // Safety check: if URL looks malformed (contains protocol twice), extract the first one
  if ((baseUrl.match(/https?:\/\//g) || []).length > 1) {
    // Extract first complete URL
    const match = baseUrl.match(/^(https?:\/\/[^/]+)/);
    if (match) {
      baseUrl = match[1];
    }
  }

  return baseUrl;
}
