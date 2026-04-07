-- Tabela de Logs de Auditoria
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `resourceType` VARCHAR(64) NOT NULL,
  `resourceId` INT,
  `resourceName` VARCHAR(255),
  `changes` JSON,
  `ipAddress` VARCHAR(64),
  `userAgent` TEXT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_action` (`action`),
  INDEX `idx_resourceType` (`resourceType`),
  INDEX `idx_createdAt` (`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Webhooks
CREATE TABLE IF NOT EXISTS `webhooks` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `url` VARCHAR(2048) NOT NULL,
  `events` JSON NOT NULL,
  `isActive` TINYINT DEFAULT 1,
  `lastTriggeredAt` TIMESTAMP,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_userId` (`userId`),
  INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Tentativas de Webhook (para rastreamento)
CREATE TABLE IF NOT EXISTS `webhook_attempts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `webhookId` INT NOT NULL,
  `event` VARCHAR(128) NOT NULL,
  `payload` JSON,
  `statusCode` INT,
  `responseTime` INT,
  `error` TEXT,
  `attemptedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_webhookId` (`webhookId`),
  INDEX `idx_event` (`event`),
  INDEX `idx_attemptedAt` (`attemptedAt`),
  FOREIGN KEY (`webhookId`) REFERENCES `webhooks`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de 2FA (TOTP)
CREATE TABLE IF NOT EXISTS `user_2fa` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL UNIQUE,
  `secret` VARCHAR(255) NOT NULL,
  `isEnabled` TINYINT DEFAULT 0,
  `backupCodes` JSON,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`userId`) REFERENCES `auth_users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
