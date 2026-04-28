import { NextResponse } from "next/server";

interface Bucket {
  tokens: number;
  lastRefill: number;
}

// In-memory store: IP → bucket
// NOTE: This is single-instance only. For multi-instance production deployments
// (e.g. Vercel with multiple serverless functions), replace with
// @upstash/ratelimit + Redis.
const store = new Map<string, Bucket>();

export interface RateLimitOptions {
  /** Maximum requests per window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

/**
 * Token-bucket rate limiter.
 * Returns true if the request should be allowed, false if it should be blocked.
 */
export function checkRateLimit(key: string, opts: RateLimitOptions): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket) {
    store.set(key, { tokens: opts.max - 1, lastRefill: now });
    return true;
  }

  // Refill tokens proportionally to elapsed time
  const elapsed = now - bucket.lastRefill;
  const refill = Math.floor((elapsed / opts.windowMs) * opts.max);

  if (refill > 0) {
    bucket.tokens = Math.min(opts.max, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) return false;

  bucket.tokens -= 1;
  return true;
}

/**
 * Returns a 429 Too Many Requests response with Retry-After header.
 */
export function tooManyRequests(windowMs: number): NextResponse {
  return NextResponse.json(
    { error: "Muitas tentativas. Aguarde antes de tentar novamente." },
    {
      status: 429,
      headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) },
    },
  );
}

/**
 * Extracts the real client IP from Next.js request headers.
 * Prefers x-forwarded-for (set by Vercel/proxies) over x-real-ip.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
