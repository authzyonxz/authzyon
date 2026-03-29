
import { mysqlTable, varchar, int, mysqlEnum, text, timestamp } from 'drizzle-orm/mysql-core';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL não encontrada!");
  process.exit(1);
}

async function main() {
  console.log("Iniciando correção automática do banco de dados...");
  
  const connection = await mysql.createConnection(databaseUrl);
  
  try {
    console.log("Aumentando tamanho da coluna 'key' na tabela 'key_validations'...");
    await connection.execute("ALTER TABLE `key_validations` MODIFY COLUMN `key` VARCHAR(100) NOT NULL");
    
    console.log("Aumentando tamanho da coluna 'key' na tabela 'access_keys'...");
    await connection.execute("ALTER TABLE `access_keys` MODIFY COLUMN `key` VARCHAR(100) NOT NULL");
    
    console.log("✅ Correção aplicada com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao aplicar correção:", error.message);
  } finally {
    await connection.end();
  }
}

main();
