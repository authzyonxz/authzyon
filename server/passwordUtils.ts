import { createHash, randomBytes } from "crypto";

/**
 * Gera hash de senha com salt usando SHA-256.
 * Formato: salt:hash
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(salt + password).digest("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica se a senha corresponde ao hash armazenado.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const computed = createHash("sha256").update(salt + password).digest("hex");
  return computed === hash;
}

/**
 * Gera um token de sessão seguro.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}
