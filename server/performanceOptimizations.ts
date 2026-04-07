import NodeCache from "node-cache";
import { db } from "./db";
import { accessKeys } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Cache em memória para chaves validadas
 * TTL: 60 segundos (pode ser ajustado conforme necessário)
 */
const keyCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });

/**
 * Obtém uma chave do cache ou do banco de dados
 */
export async function getKeyByValueWithCache(keyValue: string) {
  const cacheKey = `key:${keyValue}`;
  
  // Tenta obter do cache
  const cached = keyCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Se não estiver em cache, busca no banco de dados
  const result = await db.select().from(accessKeys).where(eq(accessKeys.key, keyValue)).limit(1);
  
  if (result.length > 0) {
    // Armazena em cache
    keyCache.set(cacheKey, result[0]);
    return result[0];
  }

  return null;
}

/**
 * Invalida o cache de uma chave
 */
export function invalidateKeyCache(keyValue: string) {
  const cacheKey = `key:${keyValue}`;
  keyCache.del(cacheKey);
}

/**
 * Limpa todo o cache de chaves
 */
export function clearKeyCache() {
  keyCache.flushAll();
}

/**
 * Obtém estatísticas do cache
 */
export function getCacheStats() {
  return keyCache.getStats();
}

/**
 * Interface para paginação
 */
export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Lista chaves com paginação
 */
export async function getKeysPaginated(
  userId: number,
  params: PaginationParams
): Promise<PaginatedResult<any>> {
  const { limit, offset } = params;

  // Obtém o total de chaves do usuário
  const countResult = await db
    .select({ count: sql`COUNT(*) as count` })
    .from(accessKeys)
    .where(eq(accessKeys.createdBy, userId));
  
  const total = countResult[0]?.count as number || 0;

  // Obtém as chaves paginadas
  const keys = await db
    .select()
    .from(accessKeys)
    .where(eq(accessKeys.createdBy, userId))
    .orderBy(desc(accessKeys.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    data: keys,
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
  };
}

/**
 * Lista histórico de validações com paginação
 */
export async function getValidationHistoryPaginated(
  params: PaginationParams
): Promise<PaginatedResult<any>> {
  const { limit, offset } = params;

  // Nota: Isso requer importar a tabela keyValidations
  // Por enquanto, retorna uma estrutura de exemplo
  return {
    data: [],
    total: 0,
    limit,
    offset,
    hasMore: false,
  };
}

/**
 * Calcula o offset baseado em página e limite
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Valida parâmetros de paginação
 */
export function validatePaginationParams(limit?: number, offset?: number): PaginationParams {
  const validLimit = Math.min(Math.max(limit || 20, 1), 100); // Entre 1 e 100
  const validOffset = Math.max(offset || 0, 0);
  
  return {
    limit: validLimit,
    offset: validOffset,
  };
}
