import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { seedAdminUser } from "../seed";
import {
  getKeyByValue,
  updateKey,
  logKeyValidation,
  getPackageByToken,
  getPackageById,
} from "../db";
import { calculateExpiry, isKeyExpired } from "../keyGenerator";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  // ─── API Pública para iOS ───────────────────────────────────────────────────
  // CORS para apps iOS
  app.use("/api/public", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
  });

  /**
   * POST /api/public/validate-key
   * Body: { key: string }
   * Valida uma key e ativa se for a primeira vez.
   */
  app.post("/api/public/validate-key", async (req, res) => {
    const { key, packageToken } = req.body ?? {};
    const ip = req.ip ?? req.headers["x-forwarded-for"]?.toString();
    const ua = req.headers["user-agent"];

    if (!key || typeof key !== "string") {
      return res.status(400).json({ success: false, result: "invalid", message: "Key não informada" });
    }

    const keyUpper = key.toUpperCase().trim();

    // 1. Verificação prioritária de Package Offline se o token for fornecido
    let packageName: string | null = null;
    if (packageToken) {
      const pkg = await getPackageByToken(packageToken);
      if (pkg && pkg.status === "offline") {
        return res.status(403).json({ success: false, result: "offline", message: "Este pacote está temporariamente offline" });
      }
      if (pkg) packageName = pkg.name;
    }

    const record = await getKeyByValue(keyUpper);

    if (!record) {
      await logKeyValidation({ key: keyUpper, result: "invalid", ipAddress: ip, userAgent: ua });
      return res.status(404).json({ success: false, result: "invalid", message: "Key inválida, insira uma key válida" });
    }

    // Validação de vínculo de Package
    if (record.packageId) {
      if (!packageToken) {
        return res.status(400).json({ success: false, result: "invalid", message: "Token do pacote não informado" });
      }
      const pkg = await getPackageByToken(packageToken);
      if (!pkg || pkg.id !== record.packageId) {
        return res.status(403).json({ success: false, result: "invalid", message: "Key não pertence a este pacote" });
      }
      // Re-checa status se já não foi checado acima
      if (pkg.status === "offline") {
        return res.status(403).json({ success: false, result: "offline", message: "Este pacote está temporariamente offline" });
      }
      packageName = pkg.name;
    }

    if (record.status === "banned") {
      await logKeyValidation({ key: keyUpper, keyId: record.id, result: "banned", ipAddress: ip, userAgent: ua });
      return res.status(403).json({ success: false, result: "banned", message: "Key banida" });
    }

    if (record.status === "paused") {
      await logKeyValidation({ key: keyUpper, keyId: record.id, result: "paused", ipAddress: ip, userAgent: ua });
      return res.status(403).json({ success: false, result: "paused", message: "Key pausada temporariamente" });
    }

    // Verifica expiração
    if (record.status === "active" && record.expiresAt && isKeyExpired(record.expiresAt)) {
      await updateKey(record.id, { status: "expired" });
      await logKeyValidation({ key: keyUpper, keyId: record.id, result: "expired", ipAddress: ip, userAgent: ua });
      return res.status(403).json({ success: false, result: "expired", message: "Key expirada" });
    }

    if (record.status === "expired") {
      await logKeyValidation({ key: keyUpper, keyId: record.id, result: "expired", ipAddress: ip, userAgent: ua });
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

    await logKeyValidation({ key: keyUpper, keyId: record.id, result: "success", ipAddress: ip, userAgent: ua });

    return res.json({
      success: true,
      result: "success",
      key: keyUpper,
      status: "active",
      activatedAt: activatedAt?.toISOString(),
      expiresAt: expiresAt?.toISOString(),
      durationDays: record.durationDays + (record.extraDays ?? 0),
      packageName,
      message: `Key Validada, KEY: ${keyUpper}`,
    });
  });

  /**
   * GET /api/public/check-key/:key
   * Verifica status de uma key já validada (para verificação automática ao reabrir o app).
   */
  app.get("/api/public/check-key/:key", async (req, res) => {
    const keyUpper = req.params.key?.toUpperCase().trim();
    const ip = req.ip ?? req.headers["x-forwarded-for"]?.toString();
    const ua = req.headers["user-agent"];

    if (!keyUpper) {
      return res.status(400).json({ success: false, result: "invalid", message: "Key não informada" });
    }

    const record = await getKeyByValue(keyUpper);

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

    // 1. Verificação prioritária de Package Offline antes de qualquer outra lógica
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
      key: keyUpper,
      status: record.status,
      activatedAt: record.activatedAt?.toISOString(),
      expiresAt: record.expiresAt?.toISOString(),
      durationDays: record.durationDays + (record.extraDays ?? 0),
      packageName,
      remainingMs: record.expiresAt ? Math.max(0, record.expiresAt.getTime() - Date.now()) : null,
    });
  });

  // OAuth callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Vite / static
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, async () => {
    console.log(`Server running on http://localhost:${port}/`);
    // Seed do admin
    await seedAdminUser();
  });
}

startServer().catch(console.error);
