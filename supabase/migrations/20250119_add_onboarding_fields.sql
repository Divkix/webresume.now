-- Add onboarding fields to profiles table
-- Migration: 20250119_add_onboarding_fields

-- Add role column with CHECK constraint for valid values
ALTER TABLE profiles
ADD COLUMN role TEXT
CHECK (role IN (
  'student',
  'recent_graduate',
  'junior_professional',
  'mid_level_professional',
  'senior_professional',
  'freelancer'
));

-- Add onboarding_completed flag
ALTER TABLE profiles
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL;

-- Create index on role column for faster lookups
CREATE INDEX idx_profiles_role ON profiles(role);

-- Add comment for documentation
COMMENT ON COLUMN profiles.role IS 'User career stage: student, recent_graduate, junior_professional, mid_level_professional, senior_professional, or freelancer';
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding wizard';
