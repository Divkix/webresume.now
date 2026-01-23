ALTER TABLE `resumes` ADD `queued_at` text;--> statement-breakpoint
ALTER TABLE `resumes` ADD `parsed_content_staged` text;--> statement-breakpoint
ALTER TABLE `resumes` ADD `last_attempt_error` text;--> statement-breakpoint
ALTER TABLE `resumes` ADD `total_attempts` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `resumes_status_queued_at_idx` ON `resumes` (`status`,`queued_at`);