import { getAuthUserByUsername, createAuthUser } from "./db";
import { hashPassword } from "./passwordUtils";

/**
 * Cria o usuário admin padrão se não existir.
 * Chamado na inicialização do servidor.
 */
export async function seedAdminUser() {
  try {
    const existing = await getAuthUserByUsername("RUAN");
    if (!existing) {
      await createAuthUser({
        username: "RUAN",
        passwordHash: hashPassword("RUAN123"),
        role: "admin",
        keyLimit: 999999,
      });
      console.log("[Seed] Admin user RUAN created successfully.");
    } else {
      console.log("[Seed] Admin user RUAN already exists.");
    }
  } catch (error) {
    console.error("[Seed] Failed to seed admin user:", error);
  }
}
