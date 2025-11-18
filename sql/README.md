# Database Setup

These SQL migration files should be executed manually in the Supabase SQL Editor in the following order:

1. **01_profiles.sql** - Creates the profiles table with RLS and indexes
2. **02_resumes.sql** - Creates the resumes table for tracking uploaded files
3. **03_site_data.sql** - Creates the site_data table for storing parsed resume content
4. **04_redirects.sql** - Creates the redirects table for handle changes
5. **05_rls_policies.sql** - Sets up Row Level Security policies for all tables

## Execution Steps

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Execute each file in order (01 → 05)
4. Verify that all tables and policies are created successfully

## Notes

- The `uuid-ossp` extension is required and is enabled in `01_profiles.sql`
- All tables have RLS enabled by default
- Public read access is granted for profiles, site_data, and redirects
- Users can only modify their own data (enforced via RLS policies)
