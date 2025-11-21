-- Add partial unique index to prevent duplicate claims of the same file
-- This uses the filename portion of r2_key to detect duplicates
-- Index only applies to non-failed resumes to allow re-uploads after failure

-- Extract filename from r2_key pattern: users/{user_id}/{timestamp}/{filename}
-- We create a unique constraint on (user_id, filename) for active resumes

CREATE UNIQUE INDEX idx_resumes_user_filename_active
ON resumes (user_id, (split_part(r2_key, '/', 4)))
WHERE status != 'failed';

COMMENT ON INDEX idx_resumes_user_filename_active IS
'Prevents duplicate claims of the same filename per user. Allows re-upload if previous attempt failed.';
