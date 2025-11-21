-- Enable Realtime for resumes table
-- This allows clients to subscribe to changes via Supabase Realtime

ALTER PUBLICATION supabase_realtime ADD TABLE resumes;

-- Add comment for documentation
COMMENT ON TABLE resumes IS 'Resume records with Realtime enabled for status updates';
