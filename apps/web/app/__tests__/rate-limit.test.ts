import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, tooManyRequests, getClientIp } from "@/lib/rate-limit";

describe("Rate Limiting (In-Memory)", () => {
  beforeEach(() => {
    // Reset in-memory store before each test
    vi.clearAllMocks();
  });

  describe("checkRateLimit - Token Bucket", () => {
    it("deve retornar true quando NODE_ENV !== 'production'", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      const result = checkRateLimit("test-key", {
        max: 5,
        windowMs: 60_000,
      });

      expect(result).toBe(true);

      process.env.NODE_ENV = originalEnv;
    });

    it("deve permitir até max requisições dentro da janela", () => {
      process.env.NODE_ENV = "production";

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit("test-key-2", {
          max: 5,
          windowMs: 60_000,
        });
        expect(result).toBe(true);
      }

      process.env.NODE_ENV = "development";
    });

    it("deve bloquear requisição quando limite é atingido", () => {
      process.env.NODE_ENV = "production";

      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-key-3", { max: 5, windowMs: 60_000 });
      }

      const result = checkRateLimit("test-key-3", {
        max: 5,
        windowMs: 60_000,
      });

      expect(result).toBe(false);

      process.env.NODE_ENV = "development";
    });

    it("deve usar chaves diferentes para cada cliente", () => {
      process.env.NODE_ENV = "production";

      for (let i = 0; i < 5; i++) {
        checkRateLimit("client-a", { max: 5, windowMs: 60_000 });
      }

      // client-b tem sua própria quota
      const result = checkRateLimit("client-b", {
        max: 5,
        windowMs: 60_000,
      });

      expect(result).toBe(true);

      process.env.NODE_ENV = "development";
    });
  });

  describe("tooManyRequests", () => {
    it("deve retornar 429 com Retry-After header", () => {
      const response = tooManyRequests(60_000);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("60");
    });

    it("deve conter mensagem de erro em português", async () => {
      const response = tooManyRequests(60_000);
      const body = await response.json();

      expect(body.error).toContain("Muitas tentativas");
    });
  });

  describe("getClientIp", () => {
    it("deve extrair IP do header x-forwarded-for", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "203.0.113.42, 198.51.100.178" },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.42");
    });

    it("deve usar x-real-ip se x-forwarded-for não estiver presente", () => {
      const request = new Request("http://localhost", {
        headers: { "x-real-ip": "192.0.2.1" },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.0.2.1");
    });

    it("deve retornar 'unknown' se nenhum IP header for encontrado", () => {
      const request = new Request("http://localhost", { headers: {} });

      const ip = getClientIp(request);
      expect(ip).toBe("unknown");
    });

    it("deve limpar whitespace do x-forwarded-for", () => {
      const request = new Request("http://localhost", {
        headers: { "x-forwarded-for": "  203.0.113.42  , 198.51.100.178" },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("203.0.113.42");
    });
  });
});
