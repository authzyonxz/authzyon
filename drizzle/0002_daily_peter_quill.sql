ALTER TABLE `access_keys` MODIFY COLUMN `key` varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE `key_validations` MODIFY COLUMN `key` varchar(64) NOT NULL;