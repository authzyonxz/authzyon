import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getAuthUserByUsername,
  getAuthUserById,
  getAllAuthUsers,
  createAuthUser,
  updateAuthUser,
  createAccessKey,
  getKeyByValue,
  getAllKeys,
  updateKey,
  banAllUserKeys,
  unbanAllUserKeys,
  createPackage,
  getAllPackages,
  getPackageById,
  deletePackage,
  updatePackage,
  getKeyStats,
  logKeyValidation,
  getKeyValidationHistory,
  createPanelSession,
  getPanelSession,
  deletePanelSession,
  cleanExpiredSessions,
} from "./db";
import { hashPassword, verifyPassword, generateSessionToken } from "./passwordUtils";
import { generateKeys, calculateExpiry, isKeyExpired } from "./keyGenerator";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { extendedRouters } from "./routers_extensions";

// ─── Middleware de autenticação customizada ───────────────────────────────────

const PANEL_SESSION_COOKIE = "authzyon_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

// Procedure que verifica sessão do painel AuthZyon
export const panelProcedure = publicProcedure.use(async ({ ctx, next }) => {
  const token = ctx.req.cookies?.[PANEL_SESSION_COOKIE];
  if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "Não autenticado" });

  await cleanExpiredSessions();
  const session = await getPanelSession(token);
  if (!session || session.expiresAt < Date.now()) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Sessão expirada" });
  }

  const user = await getAuthUserById(session.userId);
  if (!user || user.banned === 1) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário inativo" });
  }

  return next({ ctx: { ...ctx, panelUser: user } });
});

// Procedure apenas para admins
export const adminProcedure = panelProcedure.use(async ({ ctx, next }) => {
  if ((ctx as any).panelUser.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso restrito a administradores" });
  }
  return next({ ctx });
});

// ─── Router principal ─────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // Manus OAuth (mantido para compatibilidade)
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Autenticação do painel AuthZyon ───────────────────────────────────────
  panel: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const user = await getAuthUserByUsername(input.username);
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
        if (user.banned === 1) throw new TRPCError({ code: "FORBIDDEN", message: "Usuário banido" });
        if (!verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos" });
        }

        const token = generateSessionToken();
        const expiresAt = Date.now() + SESSION_TTL_MS;
        await createPanelSession({
          userId: user.id,
          token,
          ipAddress: ctx.req.ip ?? ctx.req.headers["x-forwarded-for"]?.toString(),
          userAgent: ctx.req.headers["user-agent"],
          expiresAt,
        });
        await updateAuthUser(user.id, { lastLoginAt: new Date() });

        ctx.res.cookie(PANEL_SESSION_COOKIE, token, {
          httpOnly: true,
          secure: ctx.req.protocol === "https",
          sameSite: "none",
          maxAge: SESSION_TTL_MS / 1000,
          path: "/",
        });

        return {
          success: true,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            avatarUrl: user.avatarUrl,
            keyLimit: user.keyLimit,
            keysGenerated: user.keysGenerated,
          },
        };
      }),

    logout: panelProcedure.mutation(async ({ ctx }) => {
      const token = ctx.req.cookies?.[PANEL_SESSION_COOKIE];
      if (token) await deletePanelSession(token);
      ctx.res.clearCookie(PANEL_SESSION_COOKIE, { path: "/" });
      return { success: true };
    }),

    me: panelProcedure.query(async ({ ctx }) => {
      const user = (ctx as any).panelUser;
      return {
        id: user.id,
        username: user.username,
        role: user.role,
        avatarUrl: user.avatarUrl,
        keyLimit: user.keyLimit,
        keysGenerated: user.keysGenerated,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      };
    }),

    updateProfile: panelProcedure
      .input(z.object({
        username: z.string().min(3).max(64).optional(),
        avatarBase64: z.string().optional(), // base64 da imagem
        avatarMime: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const updates: Record<string, unknown> = {};

        if (input.username) updates.username = input.username;

        if (input.avatarBase64 && input.avatarMime) {
          const buffer = Buffer.from(input.avatarBase64, "base64");
          const ext = input.avatarMime.split("/")[1] ?? "jpg";
          const key = `avatars/${user.id}-${nanoid(8)}.${ext}`;
          const { url } = await storagePut(key, buffer, input.avatarMime);
          updates.avatarUrl = url;
        }

        await updateAuthUser(user.id, updates as any);
        return { success: true };
      }),
  }),

  // ─── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    stats: panelProcedure.query(async ({ ctx }) => {
      const user = (ctx as any).panelUser;
      const keyStats = await getKeyStats();
      const allUsers = user.role === "admin" ? await getAllAuthUsers() : [];
      const recentValidations = await getKeyValidationHistory(10);

      // Dados para os gráficos (Mockados para exemplo, podem ser substituídos por queries reais)
      const validationTrend = [
        { date: "01/04", success: 12, invalid: 2, expired: 1, banned: 0, paused: 0 },
        { date: "02/04", success: 18, invalid: 5, expired: 0, banned: 1, paused: 0 },
        { date: "03/04", success: 15, invalid: 3, expired: 2, banned: 0, paused: 1 },
        { date: "04/04", success: 22, invalid: 4, expired: 1, banned: 0, paused: 0 },
        { date: "05/04", success: 30, invalid: 6, expired: 3, banned: 1, paused: 0 },
        { date: "06/04", success: 25, invalid: 2, expired: 1, banned: 0, paused: 2 },
        { date: "07/04", success: 28, invalid: 4, expired: 2, banned: 0, paused: 0 },
      ];

      const keyStatusDistribution = [
        { status: "Ativas", count: keyStats.active },
        { status: "Pendentes", count: keyStats.pending },
        { status: "Expiradas", count: keyStats.expired },
        { status: "Pausadas", count: keyStats.paused },
        { status: "Banidas", count: keyStats.banned },
      ];

      return {
        keyStats,
        totalUsers: allUsers.length,
        recentValidations,
        validationTrend,
        keyStatusDistribution,
      };
    }),
  }),

  // ─── Keys ──────────────────────────────────────────────────────────────────
  keys: router({
    generate: panelProcedure
      .input(z.object({
        count: z.number().min(1).max(100),
        durationDays: z.number().refine(v => [1, 7, 30].includes(v), "Duração inválida"),
        packageId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;

        // Verifica limite de keys
        if (user.role !== "admin") {
          const remaining = user.keyLimit - user.keysGenerated;
          if (input.count > remaining) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `Limite de keys atingido. Você pode gerar mais ${remaining} keys.`,
            });
          }
        }

        // Busca keys existentes para evitar colisão
        const existing = await getAllKeys();
        const existingSet = new Set(existing.map(k => k.key));
        const newKeys = generateKeys(input.count, existingSet);

        for (const key of newKeys) {
          await createAccessKey({
            key,
            createdBy: user.id,
            packageId: input.packageId,
            durationDays: input.durationDays,
          });
        }

        // Atualiza contador
        await updateAuthUser(user.id, { keysGenerated: user.keysGenerated + newKeys.length });

        return { keys: newKeys, count: newKeys.length };
      }),

    list: panelProcedure.query(async ({ ctx }) => {
      const user = (ctx as any).panelUser;
      // Admin vê todas as keys; usuário vê apenas as suas
      const keys = user.role === "admin"
        ? await getAllKeys()
        : await getAllKeys(user.id);

      // Verifica e atualiza keys expiradas
      const now = new Date();
      const result = [];
      for (const k of keys) {
        let status = k.status;
        if (k.status === "active" && k.expiresAt && now > k.expiresAt) {
          await updateKey(k.id, { status: "expired" });
          status = "expired";
        }
        result.push({ ...k, status });
      }
      return result;
    }),

    pause: panelProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const key = (await getAllKeys()).find(k => k.id === input.id);
        if (!key) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.role !== "admin" && key.createdBy !== user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const newStatus = key.status === "paused" ? "active" : "paused";
        await updateKey(input.id, { status: newStatus });
        return { success: true, status: newStatus };
      }),

    ban: panelProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const key = (await getAllKeys()).find(k => k.id === input.id);
        if (!key) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.role !== "admin" && key.createdBy !== user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updateKey(input.id, { status: "banned" });
        return { success: true };
      }),

    addDays: panelProcedure
      .input(z.object({ id: z.number(), days: z.number().min(1).max(365) }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const key = (await getAllKeys()).find(k => k.id === input.id);
        if (!key) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.role !== "admin" && key.createdBy !== user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const newExtraDays = (key.extraDays ?? 0) + input.days;
        const updates: Record<string, unknown> = { extraDays: newExtraDays };
        // Recalcula expiração se já ativada
        if (key.activatedAt && key.expiresAt) {
          const newExpiry = calculateExpiry(key.activatedAt, key.durationDays, newExtraDays);
          updates.expiresAt = newExpiry;
          // Se estava expirada, reativa
          if (key.status === "expired") updates.status = "active";
        }
        await updateKey(input.id, updates as any);
        return { success: true };
      }),
  }),

  // ─── Extensões (Paginação, Auditoria, Webhooks, 2FA) ──────────────
  ...extendedRouters,

  // ─── Packages ──────────────────────────────────────────────────────────────
  packages: router({
    create: panelProcedure
      .input(z.object({ name: z.string().min(1).max(128) }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const token = "pkg_" + nanoid(32);
        await createPackage({
          name: input.name,
          token,
          createdBy: user.id,
        });
        return { success: true, token };
      }),

    list: panelProcedure.query(async () => {
      // Todos os usuários (admins e users comuns) podem ver todos os pacotes
      // Isso permite que usuários criem keys vinculadas a pacotes criados por admins
      return await getAllPackages();
    }),

    delete: panelProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const pkg = await getPackageById(input.id);
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.role !== "admin" && pkg.createdBy !== user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await deletePackage(input.id);
        return { success: true };
      }),

    updateStatus: panelProcedure
      .input(z.object({ id: z.number(), status: z.enum(["online", "offline"]) }))
      .mutation(async ({ input, ctx }) => {
        const user = (ctx as any).panelUser;
        const pkg = await getPackageById(input.id);
        if (!pkg) throw new TRPCError({ code: "NOT_FOUND" });
        if (user.role !== "admin" && pkg.createdBy !== user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await updatePackage(input.id, { status: input.status });
        return { success: true };
      }),
  }),

  // ─── Usuários (apenas admin) ───────────────────────────────────────────────
  users: router({
    list: adminProcedure.query(async () => {
      const all = await getAllAuthUsers();
      return all.map(u => ({
        id: u.id,
        username: u.username,
        role: u.role,
        keyLimit: u.keyLimit,
        keysGenerated: u.keysGenerated,
        banned: u.banned,
        avatarUrl: u.avatarUrl,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }));
    }),

    create: adminProcedure
      .input(z.object({
        username: z.string().min(3).max(64),
        password: z.string().min(4),
        keyLimit: z.number().min(1).max(99999),
        role: z.enum(["admin", "user"]).default("user"),
      }))
      .mutation(async ({ input }) => {
        const existing = await getAuthUserByUsername(input.username);
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Usuário já existe" });
        await createAuthUser({
          username: input.username,
          passwordHash: hashPassword(input.password),
          role: input.role,
          keyLimit: input.keyLimit,
        });
        return { success: true };
      }),

    ban: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const me = (ctx as any).panelUser;
        if (me.id === input.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Não pode banir a si mesmo" });
        const user = await getAuthUserById(input.id);
        if (!user) throw new TRPCError({ code: "NOT_FOUND" });
        await updateAuthUser(input.id, { banned: user.banned === 1 ? 0 : 1 });
        return { success: true };
      }),

    updateLimit: adminProcedure
      .input(z.object({ id: z.number(), keyLimit: z.number().min(0).max(999999) }))
      .mutation(async ({ input }) => {
        await updateAuthUser(input.id, { keyLimit: input.keyLimit });
        return { success: true };
      }),

    resetPassword: adminProcedure
      .input(z.object({ id: z.number(), newPassword: z.string().min(4) }))
      .mutation(async ({ input }) => {
        await updateAuthUser(input.id, { passwordHash: hashPassword(input.newPassword) });
        return { success: true };
      }),
    
    banAllKeys: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await banAllUserKeys(input.userId);
        return { success: true };
      }),

    unbanAllKeys: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input }) => {
        await unbanAllUserKeys(input.userId);
        return { success: true };
      }),
  }),

  // ─── Histórico ─────────────────────────────────────────────────────────────
  history: router({
    list: panelProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
      .query(async ({ input }) => {
        return getKeyValidationHistory(input.limit);
      }),
  }),
});

export type AppRouter = typeof appRouter;
