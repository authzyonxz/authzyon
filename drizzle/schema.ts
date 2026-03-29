import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Tabela de usuários do painel (admin e usuários criados pelo admin) ───────
export const authUsers = mysqlTable("auth_users", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "user"]).default("user").notNull(),
  keyLimit: int("key_limit").default(10).notNull(), // limite de keys que pode gerar
  keysGenerated: int("keys_generated").default(0).notNull(), // total já gerado
  avatarUrl: text("avatar_url"),
  banned: int("banned").default(0).notNull(), // 0 = ativo, 1 = banido
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
});

export type AuthUser = typeof authUsers.$inferSelect;
export type InsertAuthUser = typeof authUsers.$inferInsert;

// ─── Tabela de keys de acesso ─────────────────────────────────────────────────
export const accessKeys = mysqlTable("access_keys", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  createdBy: int("created_by").notNull(), // FK -> auth_users.id
  durationDays: int("duration_days").notNull(), // 1, 7 ou 30
  extraDays: int("extra_days").default(0).notNull(), // dias extras adicionados pelo admin
  status: mysqlEnum("status", ["pending", "active", "paused", "banned", "expired"])
    .default("pending")
    .notNull(),
  activatedAt: timestamp("activated_at"), // quando foi ativada pela primeira vez
  expiresAt: timestamp("expires_at"), // calculado após ativação
  lastCheckedAt: timestamp("last_checked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type AccessKey = typeof accessKeys.$inferSelect;
export type InsertAccessKey = typeof accessKeys.$inferInsert;

// ─── Histórico de validações/logins via key ───────────────────────────────────
export const keyValidations = mysqlTable("key_validations", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 64 }).notNull(),
  keyId: int("key_id"), // FK -> access_keys.id (pode ser null se key inválida)
  result: mysqlEnum("result", ["success", "invalid", "expired", "banned", "paused"]).notNull(),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  validatedAt: timestamp("validated_at").defaultNow().notNull(),
});

export type KeyValidation = typeof keyValidations.$inferSelect;
export type InsertKeyValidation = typeof keyValidations.$inferInsert;

// ─── Sessões de login do painel ───────────────────────────────────────────────
export const panelSessions = mysqlTable("panel_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PanelSession = typeof panelSessions.$inferSelect;

// ─── Tabela de usuários do Manus OAuth (mantida para compatibilidade) ─────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
