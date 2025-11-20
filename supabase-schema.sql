-- webresume.now Database Schema
-- IMPORTANT: This is documentation only. The actual schema is managed via migrations.
-- See /supabase/migrations/ directory for the source of truth.
-- This file is kept in sync manually for reference.
-- Run this in Supabase SQL Editor for fresh database initialization ONLY.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  handle text unique,
  avatar_url text,
  headline text,
  privacy_settings jsonb default '{"show_phone": false, "show_address": false}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint handle_length check (char_length(handle) >= 3),
  constraint handle_format check (handle ~* '^[a-z0-9-]+$')
);

-- Resumes table
create table public.resumes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  r2_key text not null,
  status text not null default 'pending_claim',
  error_message text,
  replicate_job_id text, -- Replicate prediction ID for tracking AI parsing job status
  retry_count integer default 0 not null, -- Number of times parsing has been retried (max 2)
  parsed_at timestamp with time zone, -- Timestamp when AI parsing completed successfully
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  constraint status_values check (status in ('pending_claim', 'processing', 'completed', 'failed'))
);

-- Site data table (render-ready JSON)
create table public.site_data (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  resume_id uuid references public.resumes(id) on delete cascade,
  content jsonb not null,
  theme_id text default 'minimalist_creme',
  last_published_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Handle changes audit table (for precise rate limiting on handle changes)
create table public.handle_changes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  old_handle text,
  new_handle text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index resumes_user_id_idx on public.resumes(user_id);
create index resumes_status_idx on public.resumes(status);
create index site_data_user_id_idx on public.site_data(user_id);
create index handle_changes_user_id_idx on public.handle_changes(user_id);
create index handle_changes_created_at_idx on public.handle_changes(created_at);

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.resumes enable row level security;
alter table public.site_data enable row level security;
alter table public.handle_changes enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone (for handle lookup)"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Resumes policies
create policy "Users can view own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update own resumes"
  on public.resumes for update
  using (auth.uid() = user_id);

-- Site data policies
create policy "Public site data is viewable by everyone"
  on public.site_data for select
  using (true);

create policy "Users can insert own site data"
  on public.site_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own site data"
  on public.site_data for update
  using (auth.uid() = user_id);

-- Handle changes policies
create policy "Users can view own handle changes"
  on public.handle_changes for select
  using (auth.uid() = user_id);

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
