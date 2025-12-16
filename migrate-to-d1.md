Migration Summary: Supabase → Cloudflare D1 + Better Auth

What Changed

| Component | Before               | After                  |
|-----------|----------------------|------------------------|
| Database  | Supabase Postgres    | Cloudflare D1 (SQLite) |
| ORM       | Supabase Client      | Drizzle ORM            |
| Auth      | Supabase Auth        | Better Auth            |
| Session   | Supabase SSR cookies | Better Auth cookies    |
| Realtime  | Supabase Realtime    | HTTP Polling           |

Commits Made

7114bbb chore: post-migration cleanup - remove all Supabase references
019b9f0 docs: update CLAUDE.md for D1 + Better Auth architecture
3856bdf feat(db): migrate from Supabase to Cloudflare D1 + Better Auth

Files Created

- lib/db/schema.ts - Drizzle schema (8 tables)
- lib/db/index.ts - DB client factory
- lib/db/types.ts - TypeScript types for JSON fields
- lib/auth/index.ts - Better Auth server config
- lib/auth/client.ts - Better Auth client hooks
- app/api/auth/[...all]/route.ts - Better Auth handler
- migrations/0000_init.sql - D1 migration
- drizzle.config.ts - Drizzle configuration

Files Deleted

- lib/supabase/* (6 files)
- supabase/* (17 migrations + config)
- supabase-schema.sql
- app/(auth)/auth/callback/route.ts

---
What You Need To Do Next

1. Create Google OAuth App (Required)

Go to https://console.cloud.google.com/apis/credentials:

1. Create new project or select existing
2. Go to APIs & Services → Credentials
3. Click Create Credentials → OAuth 2.0 Client ID
4. Application type: Web application
5. Add Authorized redirect URIs:
- http://localhost:3000/api/auth/callback/google (development)
- https://your-domain.com/api/auth/callback/google (production)
6. Copy Client ID and Client Secret

2. Set Up Environment Variables

Create .env.local for local development:

# Better Auth (REQUIRED)
BETTER_AUTH_SECRET=<generate with: openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000

# Google OAuth (REQUIRED)
GOOGLE_CLIENT_ID=<from Google Console>
GOOGLE_CLIENT_SECRET=<from Google Console>

# Cloudflare R2 (existing - keep these)
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=<your-key>
R2_SECRET_ACCESS_KEY=<your-secret>
R2_BUCKET_NAME=webresume-uploads

# Cloudflare AI Gateway (existing - keep these)
CF_AI_GATEWAY_ACCOUNT_ID=<your-account-id>
CF_AI_GATEWAY_ID=<your-gateway-id>
CF_AIG_AUTH_TOKEN=<your-token>

# Replicate Webhook (optional)
REPLICATE_WEBHOOK_SECRET=<your-webhook-secret>

Generate the secret:
openssl rand -base64 32

3. Apply D1 Migration

Local development:
bun run db:migrate

Production:
bun run db:migrate:prod

4. Set Production Secrets

In https://dash.cloudflare.com → Workers & Pages → your worker → Settings → Variables:

Add these secrets:
- BETTER_AUTH_SECRET
- BETTER_AUTH_URL (your production URL)
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET

5. Test Locally

bun run dev

Test the auth flow:
1. Go to http://localhost:3000
2. Upload a PDF
3. Click "Sign in with Google"
4. Complete OAuth flow
5. Should redirect to /wizard

6. Deploy

bun run deploy

---
Quick Reference

| Command                 | Description                       |
|-------------------------|-----------------------------------|
| bun run dev             | Start dev server                  |
| bun run build           | Build for production              |
| bun run deploy          | Build and deploy to Cloudflare    |
| bun run db:migrate      | Apply D1 migrations locally       |
| bun run db:migrate:prod | Apply D1 migrations to production |

---
Architecture After Migration

User → Cloudflare Workers (Next.js 15)
        ↓
    Better Auth ← Google OAuth
        ↓
    Cloudflare D1 (SQLite via Drizzle ORM)
        ↓
    Cloudflare R2 (file storage)
        ↓
    Replicate API (AI parsing)

Database Tables (D1):
- user - Better Auth + profile fields (handle, headline, privacy, etc.)
- session - Better Auth sessions
- account - OAuth accounts
- verification - Email verification tokens
- resumes - Resume uploads and parsing status
- siteData - Published resume content
- handleChanges - Username change audit log
- uploadRateLimits - IP-based rate limiting
