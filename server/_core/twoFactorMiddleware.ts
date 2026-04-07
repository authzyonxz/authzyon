import { Request, Response, NextFunction } from "express";
import { verifyTOTPCode, verifyAndUseBackupCode } from "../twoFactorAuth";
import { db } from "../db";
import { user2FA } from "../../drizzle/schema_extensions";
import { eq } from "drizzle-orm";

/**
 * Middleware para verificar 2FA na sessão do painel
 * Armazena o status de 2FA verificado no objeto request
 */
export async function verify2FAMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Se não houver usuário na sessão, pula o middleware
    if (!(req as any).panelUser) {
      return next();
    }

    const userId = (req as any).panelUser.id;

    // Busca o registro de 2FA do usuário
    const twoFARecord = await db.select().from(user2FA).where(eq(user2FA.userId, userId));

    // Se 2FA não está habilitado, permite acesso
    if (!twoFARecord.length || twoFARecord[0].isEnabled !== 1) {
      (req as any).is2FAVerified = true;
      return next();
    }

    // Se 2FA está habilitado, verifica se já foi verificado nesta sessão
    if ((req as any).is2FAVerified) {
      return next();
    }

    // Se chegou aqui, 2FA é obrigatório mas não foi verificado
    // Retorna erro 403 para que o frontend redirecione para a tela de 2FA
    return res.status(403).json({
      success: false,
      code: "2FA_REQUIRED",
      message: "Autenticação de dois fatores obrigatória",
    });
  } catch (error) {
    console.error("Erro no middleware de 2FA:", error);
    return next();
  }
}

/**
 * Rota para verificar o código 2FA
 */
export async function verify2FACode(req: Request, res: Response) {
  try {
    const { code } = req.body;
    const userId = (req as any).panelUser?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Não autenticado" });
    }

    if (!code) {
      return res.status(400).json({ success: false, message: "Código não informado" });
    }

    // Busca o registro de 2FA do usuário
    const twoFARecord = await db.select().from(user2FA).where(eq(user2FA.userId, userId));

    if (!twoFARecord.length || twoFARecord[0].isEnabled !== 1) {
      return res.status(400).json({ success: false, message: "2FA não está habilitado" });
    }

    const record = twoFARecord[0];

    // Tenta verificar como código TOTP
    if (verifyTOTPCode(record.secret, code)) {
      // Marca como verificado na sessão
      (req as any).is2FAVerified = true;
      return res.json({ success: true, message: "2FA verificado com sucesso" });
    }

    // Tenta verificar como código de backup
    const isBackupCodeValid = await verifyAndUseBackupCode(userId, code.toUpperCase());
    if (isBackupCodeValid) {
      (req as any).is2FAVerified = true;
      return res.json({ success: true, message: "Código de backup usado com sucesso" });
    }

    return res.status(401).json({ success: false, message: "Código inválido" });
  } catch (error) {
    console.error("Erro ao verificar 2FA:", error);
    return res.status(500).json({ success: false, message: "Erro interno do servidor" });
  }
}
