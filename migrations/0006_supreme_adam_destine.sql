-- Clear existing rate limit records before adding NOT NULL column (ephemeral 24h data)
DELETE FROM `upload_rate_limits`;--> statement-breakpoint
ALTER TABLE `upload_rate_limits` ADD `expires_at` text NOT NULL;--> statement-breakpoint
CREATE INDEX `upload_rate_limits_expires_idx` ON `upload_rate_limits` (`expires_at`);--> statement-breakpoint
CREATE INDEX `account_user_id_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_user_id_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `session_expires_at_idx` ON `session` (`expires_at`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);