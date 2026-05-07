import crypto from "crypto";

/**
 * Generate a secure random token for password reset
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash a reset token using SHA256
 * (tokens are stored hashed in database for security)
 */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Validate password strength
 * Requirements: min 8 chars, 1 uppercase, 1 number, 1 special char
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Mínimo 8 caracteres");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Pelo menos 1 letra maiúscula");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Pelo menos 1 número");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Pelo menos 1 caractere especial (!@#$%^&*...)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a reset token has expired
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt;
}

/**
 * Get token expiration time (24 hours from now)
 */
export function getTokenExpirationTime(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  return expiresAt;
}
