# webresume.now Setup Guide

## Phase 1: Authentication Setup

### 1. Supabase Project Setup

#### Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization and project name
4. Set a strong database password
5. Select region closest to your users
6. Wait for project to be created

#### Run Database Schema
1. In Supabase Dashboard, go to "SQL Editor"
2. Click "New Query"
3. Copy contents of `supabase-schema.sql`
4. Paste and click "Run"
5. Verify tables are created in "Table Editor"

#### Configure Google OAuth
1. In Supabase Dashboard, go to "Authentication" → "Providers"
2. Find "Google" and click to expand
3. Enable the provider
4. Go to Google Cloud Console (console.cloud.google.com)
5. Create new project or select existing
6. Enable Google+ API
7. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
8. Application type: "Web application"
9. Add authorized JavaScript origins:
   - http://localhost:3000 (development)
   - https://your-domain.com (production)
10. Add authorized redirect URIs:
    - http://localhost:3000/auth/callback (development)
    - https://your-domain.com/auth/callback (production)
    - Your Supabase callback URL (shown in Supabase)
11. Copy Client ID and Client Secret
12. Paste into Supabase Google provider settings
13. Save

#### Get API Keys
1. In Supabase Dashboard, go to "Settings" → "API"
2. Copy the following values:
   - Project URL
   - anon public key
   - service_role key (keep secret!)

### 2. Environment Variables

Create `.env.local` in project root:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### 3. Test Authentication Flow

Start the development server:

```bash
bun run dev
```

Open http://localhost:3000 and test:

1. Click "Continue with Google"
2. Complete Google OAuth flow
3. Should redirect to /onboarding (which redirects to /dashboard)
4. Verify user appears in Supabase "Authentication" → "Users"
5. Verify profile created in "Table Editor" → "profiles"
6. Test logout functionality

### 4. Verify RLS Policies

In Supabase SQL Editor, run these test queries:

```sql
-- Should return all profiles (public read)
SELECT * FROM profiles;

-- Should only return current user's resumes (will be empty for now)
SELECT * FROM resumes;

-- Should return all site_data (public read, will be empty for now)
SELECT * FROM site_data;
```

## Troubleshooting

### "Cannot find module '@supabase/ssr'"
Run: `bun install`

### OAuth redirect loop
- Check `NEXT_PUBLIC_SUPABASE_URL` includes `https://`
- Verify redirect URL in Google Cloud Console matches exactly
- Clear browser cookies and try again

### "Auth session missing"
- Check middleware is running (should see middleware.ts in project root)
- Verify environment variables are set correctly
- Check browser console for errors

### Database connection errors
- Verify project URL is correct
- Check API keys are valid
- Ensure database is not paused (free tier auto-pauses)

## Next Steps

Once authentication is working:
- **Phase 2**: Implement file upload with R2
- **Phase 3**: Build public resume viewer
- **Phase 4**: Integrate AI parsing
- **Phase 5**: Add editing and polish

## File Structure Created

```
lib/
├── supabase/
│   ├── client.ts       # Browser client
│   ├── server.ts       # Server-side client
│   └── middleware.ts   # Session management
├── types/
│   └── database.ts     # TypeScript types
middleware.ts           # Route protection
components/
└── auth/
    ├── LoginButton.tsx
    └── LogoutButton.tsx
app/
├── (auth)/
│   └── auth/callback/route.ts
└── (protected)/
    ├── dashboard/page.tsx
    └── onboarding/page.tsx
supabase-schema.sql     # Database schema
.env.example            # Environment template
```

## Checkpoint Verification

Phase 1 is complete when:
- [ ] User can click "Continue with Google"
- [ ] OAuth flow completes successfully
- [ ] User is redirected to /dashboard
- [ ] User email displays on dashboard
- [ ] User can sign out
- [ ] Profile row created in Supabase
- [ ] No console errors
- [ ] Middleware protects /dashboard route

**Current Phase**: Phase 1 - Authentication Setup ✓
**Next Phase**: Phase 2 - File Upload & Claim Loop
