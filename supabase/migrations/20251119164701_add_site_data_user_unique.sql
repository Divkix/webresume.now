-- Add unique constraint to site_data.user_id
-- Fixes PostgreSQL error 42P10: "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- Ensures one-to-one relationship between users and published sites
-- Required for upsert operations in /api/resume/status route

-- Step 1: Clean up any duplicate user_id rows
-- Keep only the most recent site_data row per user (by last_published_at)
-- This handles edge cases where duplicates may have been created before constraint
DELETE FROM site_data
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM site_data
  ORDER BY user_id, last_published_at DESC NULLS LAST, created_at DESC
);

-- Step 2: Add unique constraint on user_id
-- This enables ON CONFLICT (user_id) upsert operations
ALTER TABLE site_data
ADD CONSTRAINT site_data_user_id_key UNIQUE (user_id);

-- Step 3: Add documentation comment
COMMENT ON CONSTRAINT site_data_user_id_key ON site_data IS 'Enforces one-to-one relationship: each user has exactly one published site';
