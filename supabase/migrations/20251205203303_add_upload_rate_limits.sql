-- Migration: Add upload_rate_limits table for IP-based rate limiting
-- Purpose: Track anonymous presigned URL requests by IP hash to prevent abuse
-- Note: IPs are hashed (SHA-256) for privacy/GDPR compliance

CREATE TABLE IF NOT EXISTS upload_rate_limits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_hash text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Index for efficient lookups (query pattern: WHERE ip_hash = $1 AND created_at > $2)
CREATE INDEX IF NOT EXISTS idx_upload_rate_limits_lookup
  ON upload_rate_limits(ip_hash, created_at DESC);

-- Enable RLS - only service role can access this table
ALTER TABLE upload_rate_limits ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated - only service role can read/write
-- This is enforced by RLS being enabled with no permissive policies
CREATE POLICY "Service role only"
  ON upload_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE upload_rate_limits IS
  'Tracks anonymous presigned URL requests by IP hash for rate limiting. Auto-cleanup recommended via pg_cron (DELETE WHERE created_at < now() - interval ''25 hours'')';
