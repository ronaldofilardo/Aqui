/**
 * Security: Validate environment secrets at application startup
 * Prevents deployment with weak/placeholder secrets that could compromise the application
 *
 * Build-phase tolerant: Sensitive environment variables in Vercel are NOT
 * injected during `next build` (only at runtime). Throwing at build would
 * break deployment. Validation still fires hard at runtime.
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

  // Tolerate absence of secrets during `next build` (phase-production-build).
  // Sensitive env vars in Vercel are NOT injected at build time, only runtime.
  const NEXT_PHASE = process.env.NEXT_PHASE;
  const isBuildPhase = NEXT_PHASE === "phase-production-build";
  const fail = (msg: string): void => {
    if (isBuildPhase) {
      console.warn(`${msg} (skipped at build phase - check Vercel env vars)`);
      return;
    }
    throw new Error(msg);
  };

  const nexAuthSecret = process.env.NEXTAUTH_SECRET;
  const authSecret = process.env.AUTH_SECRET;

  // Check NEXTAUTH_SECRET
  if (!nexAuthSecret) {
    fail(
      "SECURITY: NEXTAUTH_SECRET is not set. Application cannot start in production without this secret.",
    );
    if (isBuildPhase) return;
  } else if (WEAK_SECRETS.includes(nexAuthSecret)) {
    fail(
      `SECURITY: NEXTAUTH_SECRET has a weak value. Generate a new one with: openssl rand -base64 32`,
    );
  }

  // Check AUTH_SECRET
  if (!authSecret) {
    fail(
      "SECURITY: AUTH_SECRET is not set. Application cannot start in production without this secret.",
    );
    if (isBuildPhase) return;
  } else if (WEAK_SECRETS.includes(authSecret)) {
    fail(
      `SECURITY: AUTH_SECRET has a weak value. Generate a new one with: openssl rand -base64 32`,
    );
  }

  // Verify they match (only when both present)
  if (nexAuthSecret && authSecret && nexAuthSecret !== authSecret) {
    console.warn(
      "WARNING: NEXTAUTH_SECRET and AUTH_SECRET do not match. They should be identical.",
    );
  }

  if (nexAuthSecret && authSecret) {
    console.log(
      "Security validation passed: Secrets are properly configured.",
    );
  }
}
