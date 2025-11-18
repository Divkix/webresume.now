# Supabase CLI Workflow Guide

## Overview

This project uses **Supabase CLI** for database management instead of manual dashboard operations. This provides:

- ✅ Version-controlled migrations (in git)
- ✅ Local development environment (with Docker)
- ✅ Fully typed database queries (TypeScript)
- ✅ One-command deployments
- ✅ Team collaboration (reproducible schema)

---

## Quick Start

### 1. Link to Remote Project

```bash
# If not already linked
supabase link --project-ref YOUR_PROJECT_REF

# Find your project ref in Supabase dashboard URL:
# https://supabase.com/dashboard/project/YOUR_PROJECT_REF
```

### 2. Push Migrations to Remote

```bash
# Deploy all migrations to your remote Supabase project
bun run db:push

# This applies the 5 migration files in supabase/migrations/
```

### 3. Generate TypeScript Types

```bash
# Generate types from remote database
bun run db:types

# Now your queries are fully typed!
```

### 4. Start Development

```bash
# Start Next.js dev server
bun run dev

# Your app now uses the remote Supabase with typed queries
```

---

## Local Development (with Docker)

### Setup

**Requirements:**
- Docker Desktop installed and running
- ~2GB disk space for Supabase images

### Start Local Supabase

```bash
# First time takes 5-10 minutes to download images
bun run db:start
```

**Expected Output:**
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token...
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Update .env.local for Local Development

```bash
# Use local Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # from db:start output
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # from db:start output
```

### Develop Locally

```bash
# 1. Start Supabase (if not running)
bun run db:start

# 2. Open Supabase Studio (database UI)
open http://127.0.0.1:54323

# 3. Start Next.js
bun run dev

# 4. Access app at http://localhost:3000
```

### Stop Local Supabase

```bash
bun run db:stop
```

---

## Available Commands

### Database Management

```bash
# Start/Stop Local Database
bun run db:start           # Start local Supabase (Docker required)
bun run db:stop            # Stop local Supabase

# Migrations
bun run db:migrate         # Apply pending migrations locally
bun run db:reset           # Reset local DB + apply all migrations + seed data
bun run db:migration:new   # Create new migration file
bun run db:migration:list  # List local migrations

# Remote Deployment
bun run db:push            # Deploy migrations to remote Supabase
bun run db:pull            # Pull remote schema as migration file

# TypeScript Types
bun run db:types           # Generate types from remote DB
bun run db:types:local     # Generate types from local DB

# Database UI
bun run db:studio          # Open Supabase Studio (localhost:54323)
```

---

## Creating Migrations

### Step 1: Create Migration File

```bash
bun run db:migration:new add_bio_field
```

This creates: `supabase/migrations/20241118120000_add_bio_field.sql`

### Step 2: Edit Migration

```sql
-- Add bio field to profiles
ALTER TABLE profiles ADD COLUMN bio text;

-- Update existing records
UPDATE profiles SET bio = '' WHERE bio IS NULL;
```

### Step 3: Apply Locally

```bash
# Apply migration to local database
bun run db:reset

# Or just apply new migrations
bun run db:migrate
```

### Step 4: Test in App

```bash
# Next.js automatically reloads
bun run dev
```

### Step 5: Generate Types

```bash
# Update TypeScript types
bun run db:types:local
```

### Step 6: Commit

```bash
git add supabase/migrations/20241118120000_add_bio_field.sql
git add lib/supabase/types.ts
git commit -m "feat(db): add bio field to profiles"
```

### Step 7: Deploy to Production

```bash
# Push migration to remote Supabase
bun run db:push

# Generate production types
bun run db:types
```

---

## Migration Best Practices

### Naming Conventions

```bash
✅ GOOD:
- 20241118120000_create_profiles_table.sql
- 20241118130000_add_bio_to_profiles.sql
- 20241118140000_create_rls_policies.sql

❌ BAD:
- migration.sql
- update.sql
- fix.sql
```

### Migration File Rules

1. **One logical change per migration**
2. **Use idempotent operations when possible:**
   ```sql
   -- Good: Won't fail if already exists
   ALTER TABLE IF NOT EXISTS profiles ADD COLUMN bio text;

   -- Bad: Fails if run twice
   ALTER TABLE profiles ADD COLUMN bio text;
   ```
3. **Test locally before pushing**
4. **Never edit applied migrations** (create new ones instead)
5. **Always use transactions** (Postgres auto-wraps migrations)

### Example Migration Structure

```sql
-- supabase/migrations/20241118120000_add_user_preferences.sql

-- Add preferences column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS profiles_preferences_idx ON profiles USING gin(preferences);

-- Update RLS policy (if needed)
DROP POLICY IF EXISTS "Users can update own preferences" ON profiles;
CREATE POLICY "Users can update own preferences"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Comment for clarity
COMMENT ON COLUMN profiles.preferences IS 'User preferences stored as JSONB';
```

---

## TypeScript Type Usage

### Before (No Types)

```typescript
const { data } = await supabase
  .from('profiles')
  .select('id, handl, emai') // Typos! No autocomplete
  .single()

// data is `any` - no type safety
```

### After (With Types)

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()

const { data } = await supabase
  .from('profiles')
  .select('id, handle, email') // Autocomplete works!
  .single()

// data is typed as: { id: string; handle: string; email: string } | null
// TypeScript knows all columns and types!
```

### Type-Safe Inserts

```typescript
import type { TablesInsert } from '@/lib/supabase/types'

const newProfile: TablesInsert<'profiles'> = {
  id: userId,
  handle: 'john-doe',
  email: 'john@example.com',
  // TypeScript ensures all required fields are present
  // and no invalid fields are added
}

await supabase.from('profiles').insert(newProfile)
```

---

## Development Workflows

### Daily Development Loop

```bash
# Morning: Start local environment
bun run db:start        # Start Supabase
bun run dev             # Start Next.js

# During development
bun run db:migration:new feature_name
# Edit migration file
bun run db:reset        # Apply changes
bun run db:types:local  # Update types

# Evening: Stop containers
bun run db:stop
```

### Before Deploying

```bash
# 1. Test migrations locally
bun run db:reset

# 2. Verify schema in Studio
open http://127.0.0.1:54323

# 3. Test app thoroughly
bun run dev

# 4. Push to remote
bun run db:push

# 5. Generate production types
bun run db:types

# 6. Deploy app
bun run deploy
```

### Team Collaboration

```bash
# Pull latest code
git pull origin main

# Apply new migrations
bun run db:reset

# Generate types
bun run db:types:local

# Start development
bun run dev
```

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using Supabase ports
lsof -i :54321

# Stop Supabase
bun run db:stop

# Kill Docker containers manually if needed
docker ps | grep supabase
docker stop <container-id>
```

### Migration Conflicts

```bash
# Check migration status
bun run db:migration:list

# If local and remote diverged:
# Option 1: Force remote to match local
bun run db:push --force

# Option 2: Pull remote schema and start fresh
bun run db:pull baseline
# Review baseline migration, delete old ones if identical
```

### Types Not Updating

```bash
# 1. Verify database is running
supabase status

# 2. Delete old types file
rm lib/supabase/types.ts

# 3. Regenerate types
bun run db:types:local

# 4. Restart TypeScript server in your IDE
```

### Docker Not Running

```bash
# Error: "Cannot connect to Docker daemon"
# Solution: Start Docker Desktop

# Verify Docker is running
docker ps
```

---

## Migration Reference

### Current Migrations

```
supabase/migrations/
├── 20241118000001_init_profiles.sql      # User profiles + UUID extension
├── 20241118000002_init_resumes.sql       # Resume uploads
├── 20241118000003_init_site_data.sql     # Rendered site content
├── 20241118000004_init_redirects.sql     # Handle redirects
└── 20241118000005_init_rls_policies.sql  # Security policies
```

### Database Schema

**Tables:**
- `profiles` - User accounts with handles and privacy settings
- `resumes` - PDF uploads with processing status
- `site_data` - JSONB content for public pages
- `redirects` - Handle change management with expiration

**All tables have Row Level Security (RLS) enabled.**

---

## FAQ

### Do I need Docker for development?

**Local development (with Docker):**
- Full offline development
- Fast iteration cycles
- Test migrations before production

**Remote development (without Docker):**
- Use remote Supabase database
- Slower but works on any machine
- Good for quick fixes

### Can I use Supabase Studio?

**Local Studio:** `http://127.0.0.1:54323` (when `bun run db:start` is running)
**Remote Studio:** `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

Both work! Local is faster for development.

### How do I reset my local database?

```bash
# Complete reset + reapply migrations + seed data
bun run db:reset

# This is safe and commonly used during development
```

### What if I mess up a migration?

```bash
# If not pushed to remote yet:
1. Delete the migration file
2. Run: bun run db:reset
3. Create a new corrected migration

# If already pushed to remote:
# Create a new migration to fix it (never edit applied migrations)
bun run db:migration:new fix_previous_migration
```

### How do I share my schema with teammates?

```bash
# Migrations are in git!
git add supabase/migrations/
git commit -m "feat(db): add new feature"
git push

# Teammates:
git pull
bun run db:reset  # Applies all migrations locally
```

---

## Next Steps

1. ✅ Migrations are set up
2. 🔲 Link to remote project: `supabase link --project-ref YOUR_REF`
3. 🔲 Push migrations: `bun run db:push`
4. 🔲 Generate types: `bun run db:types`
5. 🔲 Start development: `bun run dev`

**Optional:** Set up local development with Docker for faster iteration.

---

## Resources

- **Supabase CLI Docs:** https://supabase.com/docs/guides/cli
- **Migration Guide:** https://supabase.com/docs/guides/cli/local-development
- **TypeScript Types:** https://supabase.com/docs/guides/api/generating-types

---

**Questions?** The setup is complete! Use `bun run db:push` to deploy your migrations to the remote database.
