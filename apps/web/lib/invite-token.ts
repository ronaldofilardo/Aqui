import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET não configurado");
  return s;
}

export function generateInviteToken(estabelecimentoId: string): string {
  const payload = Buffer.from(
    JSON.stringify({
      id: estabelecimentoId,
      exp: Date.now() + EXPIRES_MS,
      nonce: randomBytes(8).toString("hex"),
    }),
  ).toString("base64url");

  const sig = createHmac("sha256", secret())
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

export function validateInviteToken(
  token: string,
): { estabelecimentoId: string } | null {
  try {
    const dot = token.lastIndexOf(".");
    if (dot === -1) return null;

    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);

    const expectedSig = createHmac("sha256", secret())
      .update(payload)
      .digest("base64url");

    // Comparação segura contra timing attacks
    if (
      sig.length !== expectedSig.length ||
      !timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf-8"),
    );

    if (!data.id || typeof data.exp !== "number" || Date.now() > data.exp) {
      return null;
    }

    return { estabelecimentoId: data.id };
  } catch {
    return null;
  }
}
