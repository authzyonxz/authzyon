import { db } from "./db";
import { auditLogs, webhooks, webhookAttempts, InsertAuditLog, InsertWebhook, InsertWebhookAttempt } from "../drizzle/schema_extensions";
import { eq } from "drizzle-orm";
import axios from "axios";

/**
 * Registra uma ação de auditoria
 */
export async function logAuditAction(data: InsertAuditLog) {
  try {
    await db.insert(auditLogs).values(data);
  } catch (error) {
    console.error("Erro ao registrar auditoria:", error);
  }
}

/**
 * Cria um webhook para um usuário
 */
export async function createWebhook(data: InsertWebhook) {
  return await db.insert(webhooks).values(data);
}

/**
 * Lista webhooks de um usuário
 */
export async function getUserWebhooks(userId: number) {
  return await db.select().from(webhooks).where(eq(webhooks.userId, userId));
}

/**
 * Atualiza um webhook
 */
export async function updateWebhook(id: number, data: Partial<InsertWebhook>) {
  return await db.update(webhooks).set(data).where(eq(webhooks.id, id));
}

/**
 * Deleta um webhook
 */
export async function deleteWebhook(id: number) {
  return await db.delete(webhooks).where(eq(webhooks.id, id));
}

/**
 * Dispara webhooks para um evento específico
 */
export async function triggerWebhooks(event: string, payload: any) {
  try {
    // Busca todos os webhooks ativos que estão inscritos neste evento
    const activeWebhooks = await db
      .select()
      .from(webhooks)
      .where(eq(webhooks.isActive, 1));

    for (const webhook of activeWebhooks) {
      const events = webhook.events as string[];
      if (!events.includes(event)) continue;

      try {
        const startTime = Date.now();
        const response = await axios.post(webhook.url, {
          event,
          timestamp: new Date().toISOString(),
          data: payload,
        }, {
          timeout: 10000, // 10 segundos de timeout
          headers: {
            "Content-Type": "application/json",
            "X-AuthZyon-Event": event,
            "X-AuthZyon-Signature": "sha256=placeholder", // Pode ser implementado com HMAC
          },
        });

        const responseTime = Date.now() - startTime;

        // Registra a tentativa bem-sucedida
        await db.insert(webhookAttempts).values({
          webhookId: webhook.id,
          event,
          payload,
          statusCode: response.status,
          responseTime,
        });

        // Atualiza o timestamp da última ativação
        await db.update(webhooks).set({ lastTriggeredAt: new Date() }).where(eq(webhooks.id, webhook.id));
      } catch (error: any) {
        // Registra a tentativa falhada
        await db.insert(webhookAttempts).values({
          webhookId: webhook.id,
          event,
          payload,
          statusCode: error.response?.status,
          responseTime: 0,
          error: error.message,
        });

        console.error(`Erro ao disparar webhook ${webhook.id}:`, error.message);
      }
    }
  } catch (error) {
    console.error("Erro ao processar webhooks:", error);
  }
}

/**
 * Registra auditoria e dispara webhooks para ações de chaves
 */
export async function auditKeyAction(
  userId: number,
  action: string,
  keyId: number,
  keyValue: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) {
  // Registra auditoria
  await logAuditAction({
    userId,
    action,
    resourceType: "key",
    resourceId: keyId,
    resourceName: keyValue,
    changes,
    ipAddress,
    userAgent,
  });

  // Dispara webhook
  const webhookEvent = `key.${action}`;
  await triggerWebhooks(webhookEvent, {
    keyId,
    keyValue,
    action,
    changes,
  });
}

/**
 * Registra auditoria para ações de usuário
 */
export async function auditUserAction(
  userId: number,
  action: string,
  targetUserId: number,
  targetUsername: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) {
  await logAuditAction({
    userId,
    action,
    resourceType: "user",
    resourceId: targetUserId,
    resourceName: targetUsername,
    changes,
    ipAddress,
    userAgent,
  });
}

/**
 * Registra auditoria para ações de pacote
 */
export async function auditPackageAction(
  userId: number,
  action: string,
  packageId: number,
  packageName: string,
  changes?: any,
  ipAddress?: string,
  userAgent?: string
) {
  await logAuditAction({
    userId,
    action,
    resourceType: "package",
    resourceId: packageId,
    resourceName: packageName,
    changes,
    ipAddress,
    userAgent,
  });

  const webhookEvent = `package.${action}`;
  await triggerWebhooks(webhookEvent, {
    packageId,
    packageName,
    action,
    changes,
  });
}

/**
 * Obtém o histórico de auditoria de um usuário
 */
export async function getUserAuditHistory(userId: number, limit: number = 100) {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy((t) => t.createdAt)
    .limit(limit);
}

/**
 * Obtém o histórico de auditoria global (apenas para admins)
 */
export async function getGlobalAuditHistory(limit: number = 500) {
  return await db
    .select()
    .from(auditLogs)
    .orderBy((t) => t.createdAt)
    .limit(limit);
}
