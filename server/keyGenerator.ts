const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/**
 * Gera uma key alfanumérica maiúscula com comprimento entre 10 e 14 caracteres.
 * Formato: apenas letras A-Z e números 0-9, tudo maiúsculo.
 */
export function generateKey(length?: number): string {
  const len = length ?? Math.floor(Math.random() * 5) + 10; // 10 a 14
  let key = "";
  for (let i = 0; i < len; i++) {
    key += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return key;
}

/**
 * Gera múltiplas keys únicas, verificando colisões com o conjunto existente.
 */
export function generateKeys(count: number, existingKeys: Set<string> = new Set()): string[] {
  const keys: string[] = [];
  const attempts = count * 10;
  let i = 0;
  while (keys.length < count && i < attempts) {
    const key = generateKey();
    if (!existingKeys.has(key) && !keys.includes(key)) {
      keys.push(key);
    }
    i++;
  }
  return keys;
}

/**
 * Calcula a data de expiração baseada na data de ativação + dias de duração + dias extras.
 */
export function calculateExpiry(activatedAt: Date, durationDays: number, extraDays = 0): Date {
  const expiry = new Date(activatedAt);
  expiry.setDate(expiry.getDate() + durationDays + extraDays);
  return expiry;
}

/**
 * Verifica se uma key está expirada com base na data de expiração.
 */
export function isKeyExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;
  return new Date() > expiresAt;
}
