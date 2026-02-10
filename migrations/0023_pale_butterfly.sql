DROP INDEX `referral_clicks_dedup_idx`;--> statement-breakpoint
ALTER TABLE `referral_clicks` ADD `converted_at` text;--> statement-breakpoint
-- Deduplicate before enforcing UNIQUE(referrer_user_id, visitor_hash)
-- Keep the "best" row per pair: converted first, then newest.
DELETE FROM `referral_clicks`
WHERE `id` IN (
		SELECT `id`
		FROM (
				SELECT
					`id`,
					ROW_NUMBER() OVER (
						PARTITION BY `referrer_user_id`, `visitor_hash`
						ORDER BY `converted` DESC, `created_at` DESC, `id` DESC
					) AS `rn`
				FROM `referral_clicks`
			)
		WHERE `rn` > 1
	);--> statement-breakpoint
CREATE UNIQUE INDEX `referral_clicks_dedup_idx` ON `referral_clicks` (`referrer_user_id`,`visitor_hash`);--> statement-breakpoint
ALTER TABLE `user` ADD `referred_at` text;
