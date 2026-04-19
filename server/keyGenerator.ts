const CHARS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const CHARS_MIXED = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/**
 * Gera uma key no formato: PREFIXO-Xday-XXXXxxXxxx
 * O sufixo tem 15 caracteres com letras maiúsculas, minúsculas e números.
 */
export function generateKey(prefix: string, durationDays: number): string {
  const suffixLen = 15;
  let suffix = "";
  for (let i = 0; i < suffixLen; i++) {
    suffix += CHARS_MIXED[Math.floor(Math.random() * CHARS_MIXED.length)];
  }
  
  // Formato: PREFIXO-Xday-SUFFIX
  return `${prefix.toUpperCase()}-${durationDays}day-${suffix}`;
}

/**
 * Gera múltiplas keys únicas, verificando colisões com o conjunto existente.
 */
export function generateKeys(
  count: number, 
  prefix: string, 
  durationDays: number, 
  existingKeys: Set<string> = new Set()
): string[] {
  const keys: string[] = [];
  const attempts = count * 10;
  let i = 0;
  while (keys.length < count && i < attempts) {
    const key = generateKey(prefix, durationDays);
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
