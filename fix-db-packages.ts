import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

async function fix() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not found");
    return;
  }

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  console.log("Iniciando correção do banco de dados para Packages...");

  try {
    // 1. Criar tabela de packages
    console.log("Criando tabela 'packages'...");
    await connection.execute(`
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

    // 2. Adicionar coluna package_id na tabela access_keys
    console.log("Adicionando coluna 'package_id' em 'access_keys'...");
    try {
      await connection.execute(`
        ALTER TABLE \`access_keys\` ADD COLUMN \`package_id\` int AFTER \`created_by\`
      `);
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log("Coluna 'package_id' já existe.");
      } else {
        throw e;
      }
    }

    console.log("Banco de dados atualizado com sucesso!");
  } catch (error) {
    console.error("Erro ao atualizar banco de dados:", error);
  } finally {
    await connection.end();
  }
}

fix();
