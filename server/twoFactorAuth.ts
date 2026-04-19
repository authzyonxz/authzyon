import { db } from "./db";
import { user2FA, InsertUser2FA } from "../drizzle/schema_extensions";
import { eq } from "drizzle-orm";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

// Configurar otplib
authenticator.options = {
  window: 1, // Permite 1 step anterior e posterior (30 segundos cada)
};

/**
 * Gera um novo secret TOTP para um usuário
 * Retorna: { secret, qrCode }
 */
export async function generateTOTPSecret(username: string, issuer: string = "AuthZyon"): Promise<{ secret: string; qrCode: string }> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(username, issuer, secret);
  const qrCode = await QRCode.toDataURL(otpauthUrl);

  return { secret, qrCode };
}

/**
 * Verifica se um código TOTP é válido
 */
export function verifyTOTPCode(secret: string, token: string): boolean {
  try {
    return authenticator.check(token, secret);
  } catch (error) {
    return false;
  }
}

/**
 * Gera códigos de backup para 2FA
 */
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Habilita 2FA para um usuário
 */
export async function enable2FA(userId: number, secret: string): Promise<string[]> {
  const backupCodes = generateBackupCodes();

  const existing = await db.select().from(user2FA).where(eq(user2FA.userId, userId));

  if (existing.length > 0) {
    // Atualiza se já existe
    await db
      .update(user2FA)
      .set({
        secret,
        isEnabled: 0, // Não habilita até que o usuário confirme
        backupCodes,
      })
      .where(eq(user2FA.userId, userId));
  } else {
    // Cria novo registro
    await db.insert(user2FA).values({
      userId,
      secret,
      isEnabled: 0,
      backupCodes,
    });
  }

  return backupCodes;
}

/**
 * Confirma 2FA após o usuário validar o código
 */
export async function confirm2FA(userId: number, token: string, secret: string): Promise<boolean> {
  if (!verifyTOTPCode(secret, token)) {
    return false;
  }

  await db.update(user2FA).set({ isEnabled: 1 }).where(eq(user2FA.userId, userId));
  return true;
}

/**
 * Desabilita 2FA para um usuário
 */
export async function disable2FA(userId: number) {
  await db.update(user2FA).set({ isEnabled: 0 }).where(eq(user2FA.userId, userId));
}

/**
 * Obtém o status 2FA de um usuário
 */
export async function get2FAStatus(userId: number) {
  const record = await db.select().from(user2FA).where(eq(user2FA.userId, userId));
  if (record.length === 0) {
    return { isEnabled: false, hasBackupCodes: false };
  }
  return {
    isEnabled: record[0].isEnabled === 1,
    hasBackupCodes: record[0].backupCodes && Array.isArray(record[0].backupCodes) && record[0].backupCodes.length > 0,
  };
}

/**
 * Verifica se um código de backup é válido e o remove
 */
export async function verifyAndUseBackupCode(userId: number, code: string): Promise<boolean> {
  const record = await db.select().from(user2FA).where(eq(user2FA.userId, userId));
  if (record.length === 0) return false;

  const backupCodes = record[0].backupCodes as string[];
  if (!backupCodes || !backupCodes.includes(code)) {
    return false;
  }

  // Remove o código usado
  const updatedCodes = backupCodes.filter((c) => c !== code);
  await db.update(user2FA).set({ backupCodes: updatedCodes }).where(eq(user2FA.userId, userId));

  return true;
}

/**
 * Regenera códigos de backup
 */
export async function regenerateBackupCodes(userId: number): Promise<string[]> {
  const backupCodes = generateBackupCodes();
  await db.update(user2FA).set({ backupCodes }).where(eq(user2FA.userId, userId));
  return backupCodes;
}
