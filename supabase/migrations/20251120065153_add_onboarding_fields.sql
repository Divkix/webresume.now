-- Add onboarding_completed and role fields to profiles table
-- These fields are used to track wizard completion status and user career stage

-- Add onboarding_completed column (defaults to false for new users)
alter table profiles
add column if not exists onboarding_completed boolean not null default false;

-- Add role column to store user's career stage
alter table profiles
add column if not exists role text;

-- Add check constraint for role values
alter table profiles
add constraint profiles_role_check
check (role is null or role in (
  'student',
  'recent_graduate',
  'junior_professional',
  'mid_level_professional',
  'senior_professional',
  'freelancer'
));

-- Create index on onboarding_completed for faster queries
create index if not exists profiles_onboarding_completed_idx
on profiles (onboarding_completed)
where onboarding_completed = false;

-- Comment on columns
comment on column profiles.onboarding_completed is 'Tracks whether user has completed the onboarding wizard';
comment on column profiles.role is 'User career stage (student, recent_graduate, junior_professional, mid_level_professional, senior_professional, freelancer)';
