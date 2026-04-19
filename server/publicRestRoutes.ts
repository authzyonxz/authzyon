import { Express, Request, Response } from "express";
import { rateLimit } from "express-rate-limit";
import { getKeyByValue, updateKey, logKeyValidation, getPackageById } from "./db";
import { isKeyExpired, calculateExpiry } from "./keyGenerator";

/**
 * Rate limiter para rotas públicas de validação de chaves
 * Máximo 30 requisições por minuto por IP
 */
export const keyValidationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 requisições por janela
  standardHeaders: true, // Retorna informações de rate limit nos headers
  skip: (req) => {
    // Não aplica rate limit se for localhost (desenvolvimento)
    return req.ip === "127.0.0.1" || req.ip === "::1";
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      result: "rate_limited",
      message: "Muitas requisições. Tente novamente em 1 minuto.",
    });
  },
});

/**
 * Registra as rotas públicas de validação de chaves
 */
export function registerPublicRestRoutes(app: Express) {
  /**
   * POST /api/public/validate-key
   * Valida uma key pela primeira vez (ativação).
   * Corpo: { "key": "ABCDEFGHIJ12" }
   */
  app.post("/api/public/validate-key", keyValidationRateLimiter, async (req: Request, res: Response) => {
    try {
      const keyInput = req.body?.key?.trim();
      const ip = req.ip ?? req.headers["x-forwarded-for"]?.toString();
      const ua = req.headers["user-agent"];

      if (!keyInput) {
        return res.status(400).json({ success: false, result: "invalid", message: "Key não informada" });
      }

      const record = await getKeyByValue(keyInput);
      if (!record) {
        await logKeyValidation({ key: keyInput, keyId: null, result: "invalid", ipAddress: ip, userAgent: ua });
        return res.status(404).json({ success: false, result: "invalid", message: "Key inválida" });
      }

      if (record.status === "banned") {
        await logKeyValidation({ key: keyInput, keyId: record.id, result: "banned", ipAddress: ip, userAgent: ua });
        return res.status(403).json({ success: false, result: "banned", message: "Key banida" });
      }

      if (record.status === "paused") {
        await logKeyValidation({ key: keyInput, keyId: record.id, result: "paused", ipAddress: ip, userAgent: ua });
        return res.status(403).json({ success: false, result: "paused", message: "Key pausada temporariamente" });
      }

      // Verifica expiração
      if (record.status === "active" && record.expiresAt && isKeyExpired(record.expiresAt)) {
        await updateKey(record.id, { status: "expired" });
        await logKeyValidation({ key: keyInput, keyId: record.id, result: "expired", ipAddress: ip, userAgent: ua });
        return res.status(403).json({ success: false, result: "expired", message: "Key expirada" });
      }

      if (record.status === "expired") {
        await logKeyValidation({ key: keyInput, keyId: record.id, result: "expired", ipAddress: ip, userAgent: ua });
        return res.status(403).json({ success: false, result: "expired", message: "Key expirada" });
      }

      // Primeira ativação
      let expiresAt = record.expiresAt;
      let activatedAt = record.activatedAt;
      if (record.status === "pending") {
        activatedAt = new Date();
        expiresAt = calculateExpiry(activatedAt, record.durationDays, record.extraDays ?? 0);
        await updateKey(record.id, {
          status: "active",
          activatedAt,
          expiresAt,
          lastCheckedAt: new Date(),
        });
      } else {
        await updateKey(record.id, { lastCheckedAt: new Date() });
      }

      let packageName: string | null = null;
      if (record.packageId) {
        const pkg = await getPackageById(record.packageId);
        if (pkg) {
          packageName = pkg.name;
          if (pkg.status === "offline") {
            return res.status(403).json({ success: false, result: "offline", message: "Este pacote está temporariamente offline" });
          }
        }
      }

      await logKeyValidation({ key: keyInput, keyId: record.id, result: "success", ipAddress: ip, userAgent: ua });
      return res.json({
        success: true,
        result: "success",
        key: keyInput,
        status: "active",
        activatedAt: activatedAt?.toISOString(),
        expiresAt: expiresAt?.toISOString(),
        durationDays: record.durationDays + (record.extraDays ?? 0),
        packageName,
        message: `Key Validada, KEY: ${keyInput}`,
      });
    } catch (error) {
      console.error("Erro em /api/public/validate-key:", error);
      return res.status(500).json({ success: false, result: "error", message: "Erro interno do servidor" });
    }
  });

  /**
   * GET /api/public/check-key/:key
   * Verifica status de uma key já validada (para verificação automática ao reabrir o app).
   */
  app.get("/api/public/check-key/:key", keyValidationRateLimiter, async (req: Request, res: Response) => {
    try {
      const keyInput = req.params.key?.trim();
      const ip = req.ip ?? req.headers["x-forwarded-for"]?.toString();
      const ua = req.headers["user-agent"];

      if (!keyInput) {
        return res.status(400).json({ success: false, result: "invalid", message: "Key não informada" });
      }

      const record = await getKeyByValue(keyInput);
      if (!record) {
        return res.status(404).json({ success: false, result: "invalid", message: "Key inválida" });
      }

      if (record.status === "banned") {
        return res.status(403).json({ success: false, result: "banned", message: "Key banida" });
      }

      if (record.status === "paused") {
        return res.status(403).json({ success: false, result: "paused", message: "Key pausada" });
      }

      if (record.status === "pending") {
        return res.status(403).json({ success: false, result: "not_activated", message: "Key ainda não ativada" });
      }

      // Verifica expiração
      if (record.expiresAt && isKeyExpired(record.expiresAt)) {
        await updateKey(record.id, { status: "expired" });
        return res.status(403).json({ success: false, result: "expired", message: "Key expirada" });
      }

      if (record.status === "expired") {
        return res.status(403).json({ success: false, result: "expired", message: "Key expirada" });
      }

      // Verificação prioritária de Package Offline
      let packageName: string | null = null;
      if (record.packageId) {
        const pkg = await getPackageById(record.packageId);
        if (pkg) {
          packageName = pkg.name;
          if (pkg.status === "offline") {
            return res.status(403).json({ success: false, result: "offline", message: "Este pacote está temporariamente offline" });
          }
        }
      }

      await updateKey(record.id, { lastCheckedAt: new Date() });
      return res.json({
        success: true,
        result: "valid",
        key: keyInput,
        status: record.status,
        activatedAt: record.activatedAt?.toISOString(),
        expiresAt: record.expiresAt?.toISOString(),
        durationDays: record.durationDays + (record.extraDays ?? 0),
        packageName,
        remainingMs: record.expiresAt ? Math.max(0, record.expiresAt.getTime() - Date.now()) : null,
      });
    } catch (error) {
      console.error("Erro em /api/public/check-key:", error);
      return res.status(500).json({ success: false, result: "error", message: "Erro interno do servidor" });
    }
  });
}
