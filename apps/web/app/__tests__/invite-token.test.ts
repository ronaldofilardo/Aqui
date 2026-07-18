import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generateInviteToken, validateInviteToken } from "@/lib/invite-token";

process.env.NEXTAUTH_SECRET = "test-secret-key-for-unit-tests-only";

describe("invite-token", () => {
  describe("generateInviteToken", () => {
    it("deve gerar um token válido", () => {
      const token = generateInviteToken("123e4567-e89b-12d3-a456-426614174000");
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
      expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    });

    it("deve gerar tokens diferentes para o mesmo ID", () => {
      const id = "123e4567-e89b-12d3-a456-426614174000";
      const token1 = generateInviteToken(id);
      const token2 = generateInviteToken(id);
      expect(token1).not.toBe(token2);
    });
  });

  describe("validateInviteToken", () => {
    it("deve validar um token recém-gerado", () => {
      const id = "123e4567-e89b-12d3-a456-426614174000";
      const token = generateInviteToken(id);
      const result = validateInviteToken(token);
      expect(result).not.toBeNull();
      expect(result?.estabelecimentoId).toBe(id);
    });

    it("deve rejeitar um token inválido", () => {
      const result = validateInviteToken("invalid.token");
      expect(result).toBeNull();
    });

    it("deve rejeitar um token com assinatura manipulada", () => {
      const id = "123e4567-e89b-12d3-a456-426614174000";
      const token = generateInviteToken(id);
      const [payload] = token.split(".");
      const tamperedToken = `${payload}.invalidsignature`;
      const result = validateInviteToken(tamperedToken);
      expect(result).toBeNull();
    });

    it("deve rejeitar um token sem ponto", () => {
      const result = validateInviteToken("nodottoken");
      expect(result).toBeNull();
    });

    it("deve rejeitar um token com payload inválido", () => {
      const invalidPayload = Buffer.from(
        JSON.stringify({ invalid: "data" }),
      ).toString("base64url");
      const result = validateInviteToken(`${invalidPayload}.somesig`);
      expect(result).toBeNull();
    });
  });
});
