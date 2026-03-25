CREATE TABLE `access_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(20) NOT NULL,
	`created_by` int NOT NULL,
	`duration_days` int NOT NULL,
	`extra_days` int NOT NULL DEFAULT 0,
	`status` enum('pending','active','paused','banned','expired') NOT NULL DEFAULT 'pending',
	`activated_at` timestamp,
	`expires_at` timestamp,
	`last_checked_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `access_keys_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `auth_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('admin','user') NOT NULL DEFAULT 'user',
	`key_limit` int NOT NULL DEFAULT 10,
	`keys_generated` int NOT NULL DEFAULT 0,
	`avatar_url` text,
	`banned` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`last_login_at` timestamp,
	CONSTRAINT `auth_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `key_validations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(20) NOT NULL,
	`key_id` int,
	`result` enum('success','invalid','expired','banned','paused') NOT NULL,
	`ip_address` varchar(64),
	`user_agent` text,
	`validated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `key_validations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `panel_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`token` varchar(255) NOT NULL,
	`ip_address` varchar(64),
	`user_agent` text,
	`expires_at` bigint NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `panel_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `panel_sessions_token_unique` UNIQUE(`token`)
);
