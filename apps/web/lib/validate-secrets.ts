/**
 * Security: Validate environment secrets at application startup
 * Prevents deployment with weak/placeholder secrets that could compromise the application
 */

const WEAK_SECRETS = [
  "change-me-in-production",
  "asa-test-secret",
  "test-secret-for-vitest-only",
  "MUST_GENERATE_NEW_SECRET_WITH_OPENSSL_IN_PRODUCTION",
];

export function validateSecrets() {
  // Only validate in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const nexAuthSecret = process.env.NEXTAUTH_SECRET;
  const authSecret = process.env.AUTH_SECRET;

  // Check NEXTAUTH_SECRET
  if (!nexAuthSecret) {
    throw new Error(
      "🚨 SECURITY: NEXTAUTH_SECRET is not set. Application cannot start in production without this secret.",
    );
  }

  if (WEAK_SECRETS.includes(nexAuthSecret)) {
    throw new Error(
      `🚨 SECURITY: NEXTAUTH_SECRET has a weak value: "${nexAuthSecret}". Generate a new one with: openssl rand -base64 32`,
    );
  }

  // Check AUTH_SECRET
  if (!authSecret) {
    throw new Error(
      "🚨 SECURITY: AUTH_SECRET is not set. Application cannot start in production without this secret.",
    );
  }

  if (WEAK_SECRETS.includes(authSecret)) {
    throw new Error(
      `🚨 SECURITY: AUTH_SECRET has a weak value. Generate a new one with: openssl rand -base64 32`,
    );
  }

  // Verify they match
  if (nexAuthSecret !== authSecret) {
    console.warn(
      "⚠️  WARNING: NEXTAUTH_SECRET and AUTH_SECRET do not match. They should be identical.",
    );
  }

  console.log(
    "✅ Security validation passed: Secrets are properly configured.",
  );
}
