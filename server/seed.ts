import { getAuthUserByUsername, createAuthUser, getDb } from "./db";
import { hashPassword } from "./passwordUtils";
import { sql } from "drizzle-orm";

/**
 * Cria o usuário admin padrão se não existir.
 * Chamado na inicialização do servidor.
 */
export async function seedAdminUser() {
  try {
    // Garantir que as tabelas de packages existam
    const db = await getDb();
    if (db) {
      console.log("[Seed] Checking/Creating packages table...");
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`packages\` (
          \`id\` int AUTO_INCREMENT PRIMARY KEY,
          \`name\` varchar(128) NOT NULL,
          \`token\` varchar(64) NOT NULL UNIQUE,
          \`status\` enum('online', 'offline') DEFAULT 'online' NOT NULL,
          \`created_by\` int NOT NULL,
          \`created_at\` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
          \`updated_at\` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
        )
      `);

      console.log("[Seed] Checking/Adding package_id to access_keys...");
      try {
        await db.execute(sql`ALTER TABLE \`access_keys\` ADD COLUMN \`package_id\` int AFTER \`created_by\``);
      } catch (e) {
        // Ignorar se a coluna já existir
      }
    }

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
