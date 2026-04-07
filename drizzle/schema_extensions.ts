import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  bigint,
  tinyint,
  json,
} from "drizzle-orm/mysql-core";

// ─── Logs de Auditoria ─────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK -> auth_users.id
  action: varchar("action", { length: 128 }).notNull(), // "create_key", "ban_key", "update_user", etc
  resourceType: varchar("resourceType", { length: 64 }).notNull(), // "key", "user", "package", etc
  resourceId: int("resourceId"), // ID do recurso afetado
  resourceName: varchar("resourceName", { length: 255 }), // Nome legível do recurso
  changes: json("changes"), // Mudanças realizadas (antes/depois)
  ipAddress: varchar("ipAddress", { length: 64 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Webhooks ──────────────────────────────────────────────────────────────
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // FK -> auth_users.id
  url: varchar("url", { length: 2048 }).notNull(),
  events: json("events").notNull(), // ["key.created", "key.banned", "key.expired", etc]
  isActive: tinyint("isActive").default(1).notNull(),
  lastTriggeredAt: timestamp("lastTriggeredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Webhook = typeof webhooks.$inferSelect;
export type InsertWebhook = typeof webhooks.$inferInsert;

// ─── Tentativas de Webhook ─────────────────────────────────────────────────
export const webhookAttempts = mysqlTable("webhook_attempts", {
  id: int("id").autoincrement().primaryKey(),
  webhookId: int("webhookId").notNull(), // FK -> webhooks.id
  event: varchar("event", { length: 128 }).notNull(),
  payload: json("payload"), // Payload enviado
  statusCode: int("statusCode"), // HTTP status code da resposta
  responseTime: int("responseTime"), // Tempo em ms
  error: text("error"), // Mensagem de erro se houver
  attemptedAt: timestamp("attemptedAt").defaultNow().notNull(),
});
export type WebhookAttempt = typeof webhookAttempts.$inferSelect;
export type InsertWebhookAttempt = typeof webhookAttempts.$inferInsert;

// ─── 2FA (TOTP) ────────────────────────────────────────────────────────────
export const user2FA = mysqlTable("user_2fa", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // FK -> auth_users.id
  secret: varchar("secret", { length: 255 }).notNull(), // Secret TOTP criptografado
  isEnabled: tinyint("isEnabled").default(0).notNull(),
  backupCodes: json("backupCodes"), // Códigos de backup em caso de perda do dispositivo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type User2FA = typeof user2FA.$inferSelect;
export type InsertUser2FA = typeof user2FA.$inferInsert;
