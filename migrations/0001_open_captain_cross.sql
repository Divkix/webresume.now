CREATE INDEX `resumes_file_hash_idx` ON `resumes` (`file_hash`);--> statement-breakpoint
CREATE INDEX `resumes_replicate_job_id_idx` ON `resumes` (`replicate_job_id`);