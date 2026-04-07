import { Parser } from "json2csv";

/**
 * Exporta um array de objetos para CSV
 */
export function convertToCSV(data: any[], fields?: string[]): string {
  if (data.length === 0) {
    return "";
  }

  try {
    // Se não especificar fields, usa as chaves do primeiro objeto
    const fieldsToUse = fields || Object.keys(data[0]);
    
    const parser = new Parser({ fields: fieldsToUse });
    return parser.parse(data);
  } catch (error) {
    console.error("Erro ao converter para CSV:", error);
    throw error;
  }
}

/**
 * Formata dados de chaves para exportação
 */
export function formatKeysForExport(keys: any[]): any[] {
  return keys.map((key) => ({
    "ID": key.id,
    "Chave": key.key,
    "Status": key.status,
    "Duração (dias)": key.durationDays,
    "Dias Extras": key.extraDays || 0,
    "Ativada em": key.activatedAt ? new Date(key.activatedAt).toLocaleString("pt-BR") : "—",
    "Expira em": key.expiresAt ? new Date(key.expiresAt).toLocaleString("pt-BR") : "—",
    "Criada em": key.createdAt ? new Date(key.createdAt).toLocaleString("pt-BR") : "—",
    "Última verificação": key.lastCheckedAt ? new Date(key.lastCheckedAt).toLocaleString("pt-BR") : "—",
  }));
}

/**
 * Formata dados de histórico de validações para exportação
 */
export function formatHistoryForExport(history: any[]): any[] {
  return history.map((record) => ({
    "ID": record.id,
    "Chave": record.key,
    "Resultado": record.result,
    "IP": record.ipAddress || "—",
    "User Agent": record.userAgent ? record.userAgent.substring(0, 50) + "..." : "—",
    "Data/Hora": record.validatedAt ? new Date(record.validatedAt).toLocaleString("pt-BR") : "—",
  }));
}

/**
 * Formata dados de usuários para exportação
 */
export function formatUsersForExport(users: any[]): any[] {
  return users.map((user) => ({
    "ID": user.id,
    "Usuário": user.username,
    "Função": user.role,
    "Limite de Keys": user.keyLimit,
    "Keys Geradas": user.keysGenerated,
    "Status": user.banned === 1 ? "Banido" : "Ativo",
    "Criado em": user.createdAt ? new Date(user.createdAt).toLocaleString("pt-BR") : "—",
    "Último Login": user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("pt-BR") : "—",
  }));
}

/**
 * Formata dados de auditoria para exportação
 */
export function formatAuditForExport(logs: any[]): any[] {
  return logs.map((log) => ({
    "ID": log.id,
    "Usuário ID": log.userId,
    "Ação": log.action,
    "Tipo de Recurso": log.resourceType,
    "ID do Recurso": log.resourceId || "—",
    "Nome do Recurso": log.resourceName || "—",
    "IP": log.ipAddress || "—",
    "Data/Hora": log.createdAt ? new Date(log.createdAt).toLocaleString("pt-BR") : "—",
  }));
}

/**
 * Cria um nome de arquivo com timestamp
 */
export function generateExportFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-").split("T")[0];
  const time = now.toTimeString().split(" ")[0].replace(/:/g, "-");
  return `${prefix}_${timestamp}_${time}.csv`;
}

/**
 * Cria headers de resposta para download de arquivo
 */
export function getCSVHeaders(filename: string) {
  return {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
}
