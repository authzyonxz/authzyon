import { describe, expect, it } from "vitest";
import { generateKey, generateKeys, calculateExpiry, isKeyExpired } from "./keyGenerator";
import { hashPassword, verifyPassword, generateSessionToken } from "./passwordUtils";

// ─── Key Generator Tests ──────────────────────────────────────────────────────

describe("generateKey", () => {
  it("gera uma key com comprimento entre 10 e 14 caracteres", () => {
    for (let i = 0; i < 50; i++) {
      const key = generateKey();
      expect(key.length).toBeGreaterThanOrEqual(10);
      expect(key.length).toBeLessThanOrEqual(14);
    }
  });

  it("gera apenas caracteres maiúsculos A-Z e 0-9", () => {
    for (let i = 0; i < 50; i++) {
      const key = generateKey();
      expect(key).toMatch(/^[A-Z0-9]+$/);
    }
  });

  it("gera key com comprimento específico quando informado", () => {
    const key = generateKey(12);
    expect(key.length).toBe(12);
  });
});

describe("generateKeys", () => {
  it("gera a quantidade correta de keys", () => {
    const keys = generateKeys(5);
    expect(keys).toHaveLength(5);
  });

  it("não gera keys duplicadas", () => {
    const keys = generateKeys(20);
    const unique = new Set(keys);
    expect(unique.size).toBe(20);
  });

  it("não gera keys que já existem no conjunto fornecido", () => {
    const existing = new Set(["ABCDEFGHIJ", "KLMNOPQRST"]);
    const keys = generateKeys(10, existing);
    for (const key of keys) {
      expect(existing.has(key)).toBe(false);
    }
  });
});

describe("calculateExpiry", () => {
  it("calcula expiração corretamente para 1 dia", () => {
    const now = new Date("2026-01-01T12:00:00Z");
    const expiry = calculateExpiry(now, 1, 0);
    expect(expiry.toISOString()).toBe("2026-01-02T12:00:00.000Z");
  });

  it("calcula expiração corretamente para 7 dias com 3 extras", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const expiry = calculateExpiry(now, 7, 3);
    expect(expiry.toISOString()).toBe("2026-01-11T00:00:00.000Z");
  });

  it("calcula expiração para 30 dias", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const expiry = calculateExpiry(now, 30, 0);
    expect(expiry.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });
});

describe("isKeyExpired", () => {
  it("retorna true para data no passado", () => {
    const past = new Date(Date.now() - 1000 * 60 * 60);
    expect(isKeyExpired(past)).toBe(true);
  });

  it("retorna false para data no futuro", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60);
    expect(isKeyExpired(future)).toBe(false);
  });

  it("retorna false para null", () => {
    expect(isKeyExpired(null)).toBe(false);
  });
});

// ─── Password Utils Tests ─────────────────────────────────────────────────────

describe("hashPassword / verifyPassword", () => {
  it("gera hash diferente da senha original", () => {
    const hash = hashPassword("RUAN123");
    expect(hash).not.toBe("RUAN123");
    expect(hash).toContain(":");
  });

  it("verifica senha correta com sucesso", () => {
    const hash = hashPassword("RUAN123");
    expect(verifyPassword("RUAN123", hash)).toBe(true);
  });

  it("rejeita senha incorreta", () => {
    const hash = hashPassword("RUAN123");
    expect(verifyPassword("senhaerrada", hash)).toBe(false);
  });

  it("dois hashes da mesma senha são diferentes (salt único)", () => {
    const h1 = hashPassword("minhaSenha");
    const h2 = hashPassword("minhaSenha");
    expect(h1).not.toBe(h2);
    // Mas ambos verificam corretamente
    expect(verifyPassword("minhaSenha", h1)).toBe(true);
    expect(verifyPassword("minhaSenha", h2)).toBe(true);
  });

  it("retorna false para hash inválido", () => {
    expect(verifyPassword("senha", "hashseminvalido")).toBe(false);
  });
});

describe("generateSessionToken", () => {
  it("gera token com 64 caracteres hex", () => {
    const token = generateSessionToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[a-f0-9]+$/);
  });

  it("gera tokens únicos", () => {
    const t1 = generateSessionToken();
    const t2 = generateSessionToken();
    expect(t1).not.toBe(t2);
  });
});
