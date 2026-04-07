import { router, publicProcedure } from "./_core/trpc";
import { panelProcedure, adminProcedure } from "./routers";
import { z } from "zod";
import { trpc } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { 
  getKeysPaginated, 
  validatePaginationParams,
  getKeyByValueWithCache,
  invalidateKeyCache,
} from "./performanceOptimizations";
import {
  convertToCSV,
  formatKeysForExport,
  formatHistoryForExport,
  formatUsersForExport,
  formatAuditForExport,
  generateExportFilename,
} from "./exportUtils";
import {
  logAuditAction,
  getUserWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getGlobalAuditHistory,
  getUserAuditHistory,
} from "./auditAndWebhooks";
import {
  generateTOTPSecret,
  enable2FA,
  confirm2FA,
  disable2FA,
  get2FAStatus,
  verifyAndUseBackupCode,
  regenerateBackupCodes,
} from "./twoFactorAuth";
import { getAllAuthUsers, getAuthUserById, getKeyByValue, getKeyValidationHistory } from "./db";

/**
 * Extensões de rotas para paginação, exportação, auditoria, webhooks e 2FA
 */
export const extendedRouters = {
  // ─── Paginação de Keys ─────────────────────────────────────────────────────
  keys: router({
    listPaginated: panelProcedure
      .input(z.object({
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      }))
      .query(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const params = validatePaginationParams(input.limit, input.offset);
        return await getKeysPaginated(user.id, params);
      }),

    // Exportar Keys para CSV
    exportCSV: panelProcedure
      .input(z.object({
        status: z.enum(["all", "pending", "active", "paused", "banned", "expired"]).default("all"),
      }))
      .query(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        
        // Busca todas as chaves do usuário (sem paginação para exportação)
        const keys = await getAllAuthUsers(); // Placeholder - substituir pela query correta
        
        const formatted = formatKeysForExport(keys);
        const csv = convertToCSV(formatted);
        const filename = generateExportFilename("keys");
        
        return { csv, filename };
      }),
  }),

  // ─── Exportação de Histórico ───────────────────────────────────────────────
  history: router({
    exportCSV: panelProcedure
      .query(async () => {
        const history = await getKeyValidationHistory(1000);
        const formatted = formatHistoryForExport(history);
        const csv = convertToCSV(formatted);
        const filename = generateExportFilename("historico-validacoes");
        
        return { csv, filename };
      }),
  }),

  // ─── Exportação de Usuários (apenas admin) ─────────────────────────────────
  users: router({
    exportCSV: adminProcedure
      .query(async () => {
        const users = await getAllAuthUsers();
        const formatted = formatUsersForExport(users);
        const csv = convertToCSV(formatted);
        const filename = generateExportFilename("usuarios");
        
        return { csv, filename };
      }),
  }),

  // ─── Auditoria ─────────────────────────────────────────────────────────────
  audit: router({
    // Histórico de auditoria do usuário
    myHistory: panelProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
      .query(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        return await getUserAuditHistory(user.id, input.limit);
      }),

    // Histórico global de auditoria (apenas admin)
    globalHistory: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
      .query(async ({ input }) => {
        return await getGlobalAuditHistory(input.limit);
      }),

    // Exportar auditoria para CSV (apenas admin)
    exportCSV: adminProcedure
      .query(async () => {
        const logs = await getGlobalAuditHistory(5000);
        const formatted = formatAuditForExport(logs);
        const csv = convertToCSV(formatted);
        const filename = generateExportFilename("auditoria");
        
        return { csv, filename };
      }),
  }),

  // ─── Webhooks ──────────────────────────────────────────────────────────────
  webhooks: router({
    list: panelProcedure
      .query(async ({ ctx }) => {
        const user = (ctx as any).panelUser;
        return await getUserWebhooks(user.id);
      }),

    create: panelProcedure
      .input(z.object({
        url: z.string().url(),
        events: z.array(z.string()).min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        
        // Log de auditoria
        await logAuditAction({
          userId: user.id,
          action: "create_webhook",
          resourceType: "webhook",
          resourceName: input.url,
        });

        return await createWebhook({
          userId: user.id,
          url: input.url,
          events: input.events,
          isActive: 1,
        });
      }),

    update: panelProcedure
      .input(z.object({
        id: z.number(),
        url: z.string().url().optional(),
        events: z.array(z.string()).optional(),
        isActive: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const { id, ...updates } = input;

        // Verifica se o webhook pertence ao usuário
        const webhooks = await getUserWebhooks(user.id);
        if (!webhooks.find((w) => w.id === id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Log de auditoria
        await logAuditAction({
          userId: user.id,
          action: "update_webhook",
          resourceType: "webhook",
          resourceId: id,
          changes: updates,
        });

        return await updateWebhook(id, updates as any);
      }),

    delete: panelProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;

        // Verifica se o webhook pertence ao usuário
        const webhooks = await getUserWebhooks(user.id);
        if (!webhooks.find((w) => w.id === input.id)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Log de auditoria
        await logAuditAction({
          userId: user.id,
          action: "delete_webhook",
          resourceType: "webhook",
          resourceId: input.id,
        });

        return await deleteWebhook(input.id);
      }),
  }),

  // ─── 2FA (Autenticação de Dois Fatores) ────────────────────────────────────
  twoFactor: router({
    // Obtém status 2FA do usuário
    status: panelProcedure
      .query(async ({ ctx }) => {
        const user = (ctx as any).panelUser;
        return await get2FAStatus(user.id);
      }),

    // Inicia o processo de ativação 2FA
    initiate: panelProcedure
      .query(async ({ ctx }) => {
        const user = (ctx as any).panelUser;
        const { secret, qrCode } = await generateTOTPSecret(user.username);
        
        // Armazena o secret temporário na sessão (será confirmado depois)
        // Nota: Isso requer ajuste na estrutura de contexto para armazenar dados temporários
        
        return { secret, qrCode };
      }),

    // Confirma a ativação 2FA
    confirm: panelProcedure
      .input(z.object({
        token: z.string(),
        secret: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        
        const confirmed = await confirm2FA(user.id, input.token, input.secret);
        if (!confirmed) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Código inválido" });
        }

        // Log de auditoria
        await logAuditAction({
          userId: user.id,
          action: "enable_2fa",
          resourceType: "user",
          resourceId: user.id,
        });

        return { success: true };
      }),

    // Desabilita 2FA
    disable: panelProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        
        // Nota: Aqui você deve verificar a senha do usuário antes de desabilitar
        
        await disable2FA(user.id);

        // Log de auditoria
        await logAuditAction({
          userId: user.id,
          action: "disable_2fa",
          resourceType: "user",
          resourceId: user.id,
        });

        return { success: true };
      }),

    // Regenera códigos de backup
    regenerateBackupCodes: panelProcedure
      .mutation(async ({ ctx }) => {
        const user = (ctx as any).panelUser;
        const codes = await regenerateBackupCodes(user.id);
        
        return { codes };
      }),
  }),
};
