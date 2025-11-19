-- Drop redirects table and related objects
-- Old handles will be immediately available for new users after handle changes

-- Drop the cleanup function first
drop function if exists public.cleanup_expired_redirects();

-- Drop RLS policy
drop policy if exists "Redirects are viewable by everyone" on public.redirects;

-- Drop indexes
drop index if exists public.redirects_old_handle_idx;
drop index if exists public.redirects_expires_at_idx;

-- Drop the table
drop table if exists public.redirects;
