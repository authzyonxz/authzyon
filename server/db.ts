import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { accessKeys, authUsers, InsertUser, keyValidations, panelSessions, users, packages, keyPrefixes } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// Exportação direta do db para uso em outros módulos (lazy initialization)
export const db = {
  insert: async (...args: any[]) => (await getDb())!.insert(...args),
  select: async (...args: any[]) => (await getDb())!.select(...args),
  update: async (...args: any[]) => (await getDb())!.update(...args),
  delete: async (...args: any[]) => (await getDb())!.delete(...args),
} as any;

// ─── Auth Users ───────────────────────────────────────────────────────────────

export async function getAuthUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(authUsers).where(eq(authUsers.username, username)).limit(1);
  return result[0];
}

export async function getAuthUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(authUsers).where(eq(authUsers.id, id)).limit(1);
  return result[0];
}

export async function getAllAuthUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(authUsers).orderBy(desc(authUsers.createdAt));
}

export async function createAuthUser(data: {
  username: string;
  passwordHash: string;
  role?: "admin" | "user";
  keyLimit?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(authUsers).values({
    username: data.username,
    passwordHash: data.passwordHash,
    role: data.role ?? "user",
    keyLimit: data.keyLimit ?? 10,
  });
}

export async function updateAuthUser(id: number, data: Partial<{
  username: string;
  passwordHash: string;
  keyLimit: number;
  keysGenerated: number;
  avatarUrl: string | null;
  banned: number;
  lastLoginAt: Date;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(authUsers).set(data).where(eq(authUsers.id, id));
}

// ─── Packages ─────────────────────────────────────────────────────────────────

export async function createPackage(data: {
  name: string;
  token: string;
  createdBy: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(packages).values(data);
}

export async function getAllPackages(createdBy?: number) {
  const db = await getDb();
  if (!db) return [];
  if (createdBy !== undefined) {
    return db.select().from(packages).where(eq(packages.createdBy, createdBy)).orderBy(desc(packages.createdAt));
  }
  return db.select().from(packages).orderBy(desc(packages.createdAt));
}

export async function getPackageById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  return result[0];
}

export async function getPackageByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(packages).where(eq(packages.token, token)).limit(1);
  return result[0];
}

export async function deletePackage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(packages).where(eq(packages.id, id));
}

export async function updatePackage(id: number, data: Partial<{
  name: string;
  status: "online" | "offline";
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(packages).set(data).where(eq(packages.id, id));
}

// ─── Access Keys ──────────────────────────────────────────────────────────────

export async function createAccessKey(data: {
  key: string;
  createdBy: number;
  packageId?: number;
  durationDays: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(accessKeys).values(data);
}

export async function getKeyByValue(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accessKeys).where(eq(accessKeys.key, key)).limit(1);
  return result[0];
}

export async function getAllKeys(createdBy?: number) {
  const db = await getDb();
  if (!db) return [];
  if (createdBy !== undefined) {
    return db.select().from(accessKeys).where(eq(accessKeys.createdBy, createdBy)).orderBy(desc(accessKeys.createdAt));
  }
  return db.select().from(accessKeys).orderBy(desc(accessKeys.createdAt));
}

export async function updateKey(id: number, data: Partial<{
  status: "pending" | "active" | "paused" | "banned" | "expired";
  activatedAt: Date | null;
  expiresAt: Date | null;
  extraDays: number;
  lastCheckedAt: Date;
}>) {
  const db = await getDb();
  if (!db) return;
  await db.update(accessKeys).set(data).where(eq(accessKeys.id, id));
}

export async function banAllUserKeys(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(accessKeys).set({ status: "banned" }).where(eq(accessKeys.createdBy, userId));
}

export async function unbanAllUserKeys(userId: number) {
  const db = await getDb();
  if (!db) return;
  // Restaura para "active" se já ativada, ou "pending" se nunca usada
  await db.update(accessKeys)
    .set({ status: sql`CASE WHEN activated_at IS NOT NULL THEN 'active' ELSE 'pending' END` })
    .where(and(eq(accessKeys.createdBy, userId), eq(accessKeys.status, "banned")));
}

export async function getKeyStats() {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, active: 0, paused: 0, banned: 0, expired: 0 };
  const rows = await db.select({
    status: accessKeys.status,
    count: sql<number>`count(*)`,
  }).from(accessKeys).groupBy(accessKeys.status);
  const stats = { total: 0, pending: 0, active: 0, paused: 0, banned: 0, expired: 0 };
  for (const row of rows) {
    stats[row.status] = Number(row.count);
    stats.total += Number(row.count);
  }
  return stats;
}

// ─── Key Validations ──────────────────────────────────────────────────────────

export async function logKeyValidation(data: {
  key: string;
  keyId?: number;
  result: "success" | "invalid" | "expired" | "banned" | "paused";
  ipAddress?: string;
  userAgent?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(keyValidations).values({
    key: data.key,
    keyId: data.keyId ?? null,
    result: data.result,
    ipAddress: data.ipAddress ?? null,
    userAgent: data.userAgent ?? null,
  });
}

export async function getKeyValidationHistory(limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(keyValidations).orderBy(desc(keyValidations.validatedAt)).limit(limit);
}

// ─── Panel Sessions ───────────────────────────────────────────────────────────

export async function createPanelSession(data: {
  userId: number;
  token: string;
  ipAddress?: string;
  userAgent?: string;
  expiresAt: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(panelSessions).values(data);
}

export async function getPanelSession(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(panelSessions).where(eq(panelSessions.token, token)).limit(1);
  return result[0];
}

export async function deletePanelSession(token: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(panelSessions).where(eq(panelSessions.token, token));
}

export async function cleanExpiredSessions() {
  const db = await getDb();
  if (!db) return;
  await db.delete(panelSessions).where(sql`expires_at < ${Date.now()}`);
}

// ─── Manus OAuth users (mantido para compatibilidade) ─────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Key Prefixes ─────────────────────────────────────────────────────────────

export async function getUserPrefixes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(keyPrefixes).where(eq(keyPrefixes.userId, userId)).orderBy(desc(keyPrefixes.createdAt));
}

export async function createPrefix(userId: number, prefix: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  
  // Verifica limite de 3 prefixos
  const existing = await getUserPrefixes(userId);
  if (existing.length >= 3) {
    throw new Error("Limite de 3 prefixos atingido");
  }

  await db.insert(keyPrefixes).values({
    userId,
    prefix: prefix.trim().toUpperCase(),
  });
}

export async function deletePrefix(userId: number, prefixId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(keyPrefixes).where(and(eq(keyPrefixes.id, prefixId), eq(keyPrefixes.userId, userId)));
}
