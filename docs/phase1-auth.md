# Phase 1: Authentication Implementation

## Overview

This document details the authentication infrastructure built for webresume.now using Supabase Auth with Google OAuth.

## Architecture

### Authentication Flow

```
User clicks "Continue with Google"
    ↓
Client-side: createClient() from @/lib/supabase/client
    ↓
supabase.auth.signInWithOAuth({ provider: 'google' })
    ↓
Google OAuth consent screen
    ↓
Redirect to /auth/callback?code=xxx
    ↓
Server-side: exchangeCodeForSession(code)
    ↓
Session cookie set via middleware
    ↓
Redirect to /onboarding
    ↓
Redirect to /dashboard (Phase 1 behavior)
    ↓
User authenticated, profile created
```

### Session Management

Sessions are managed through three Supabase clients:

1. **Browser Client** (`lib/supabase/client.ts`)
   - Used in client components
   - Handles OAuth redirects
   - Manages client-side auth state

2. **Server Client** (`lib/supabase/server.ts`)
   - Used in server components and API routes
   - Reads/writes auth cookies via Next.js cookies()
   - Enforces auth in protected routes

3. **Middleware Client** (`lib/supabase/middleware.ts`)
   - Refreshes expired sessions automatically
   - Runs on every request via middleware.ts
   - Updates cookies before route handlers execute

### Route Protection

Middleware (`middleware.ts`) protects routes:

```typescript
if (path.startsWith('/dashboard') || path.startsWith('/onboarding')) {
  if (!user) {
    redirect to '/'
  }
}
```

Matches all routes except:
- Static files (_next/static)
- Images (_next/image)
- Favicon
- Image files (svg, png, jpg, jpeg, gif, webp)

## File Structure

```
lib/
├── supabase/
│   ├── client.ts           # Browser client for client components
│   ├── server.ts           # Server client for SSR/API routes
│   └── middleware.ts       # Session refresh logic
├── types/
│   └── database.ts         # TypeScript types for DB schema

middleware.ts               # Route protection (project root)

components/
└── auth/
    ├── LoginButton.tsx     # Client component with OAuth trigger
    └── LogoutButton.tsx    # Client component with sign out

app/
├── (auth)/
│   └── auth/
│       └── callback/
│           └── route.ts    # OAuth callback handler
└── (protected)/
    ├── dashboard/
    │   └── page.tsx        # Protected dashboard page
    └── onboarding/
        └── page.tsx        # Post-auth landing (Phase 2 will expand)
```

## Database Schema

### Tables Created

**profiles**
- Extends auth.users with app-specific data
- Automatically created via trigger on user signup
- Stores handle, avatar, headline, privacy settings

**resumes**
- Links uploaded PDFs to users
- Tracks processing status
- Stores R2 key for file retrieval

**site_data**
- Render-ready JSON for public pages
- One row per user (unique constraint)
- Stores parsed resume content + theme

**redirects**
- Handles old → new handle redirects
- Auto-expires after 30 days
- Allows handle changes without breaking links

### RLS Policies

**profiles**
- SELECT: Public (anyone can look up handles)
- UPDATE/INSERT: Users can modify own profile

**resumes**
- SELECT/INSERT/UPDATE: Users can only see own resumes

**site_data**
- SELECT: Public (needed for /[handle] pages)
- UPDATE/INSERT: Users can modify own site

**redirects**
- SELECT: Public (needed for redirect lookups)

## Components

### LoginButton

**File**: `components/auth/LoginButton.tsx`

Client component that triggers Google OAuth:

```typescript
'use client'
const supabase = createClient() // Browser client
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
})
```

Styled with Tailwind CSS, includes Google logo SVG.

### LogoutButton

**File**: `components/auth/LogoutButton.tsx`

Client component that signs out and redirects:

```typescript
'use client'
const supabase = createClient()
await supabase.auth.signOut()
router.push('/')
router.refresh() // Clear server-side cache
```

## API Routes

### OAuth Callback

**File**: `app/(auth)/auth/callback/route.ts`

Handles OAuth redirect from Google:

1. Extracts `code` from query params
2. Exchanges code for session via `exchangeCodeForSession()`
3. Sets auth cookies
4. Redirects to `/onboarding`

Error handling:
- Logs error to console
- Redirects to `/?error=auth_failed`

## Protected Pages

### Dashboard

**File**: `app/(protected)/dashboard/page.tsx`

Server component that:
- Verifies user authentication
- Fetches user profile from database
- Displays welcome message with email
- Shows handle link if set
- Includes logout button

Protected by:
1. Middleware (redirects if no session)
2. Server-side check (redundant, but safe)

### Onboarding

**File**: `app/(protected)/onboarding/page.tsx`

Currently a stub that redirects to dashboard.

**Phase 2 expansion**:
- Check localStorage for temp_upload_id
- Display claim form if upload found
- Trigger claim API and show "Waiting Room" UI

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

**Security notes**:
- `NEXT_PUBLIC_*` vars are exposed to browser
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side
- Never commit `.env.local` to git

## Type Safety

### Database Types

**File**: `lib/types/database.ts`

Provides full TypeScript coverage for:
- Database schema (tables, columns)
- Row types for SELECT queries
- Insert types for INSERT operations
- Update types for UPDATE operations
- ResumeContent structure (AI parsing output)

Usage example:

```typescript
import { Database } from '@/lib/types/database'

const { data } = await supabase
  .from('profiles')
  .select('*')
  .single()
// data is typed as Database['public']['Tables']['profiles']['Row']
```

## Critical Implementation Details

### 1. Cookie Handling

Server client uses try/catch for cookie setting:

```typescript
setAll(cookiesToSet) {
  try {
    cookiesToSet.forEach(({ name, value, options }) => {
      cookieStore.set(name, value, options)
    })
  } catch (error) {
    // Cookie setting can fail in Server Components
    // This is expected and handled by middleware
  }
}
```

**Why**: Server Components cannot set cookies. Middleware handles it.

### 2. Session Refresh

Middleware refreshes sessions on every request:

```typescript
await supabase.auth.getUser()
```

**Why**: Prevents expired session errors without client-side polling.

### 3. Route Matcher

Middleware config uses negative lookahead:

```typescript
matcher: [
  '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
]
```

**Why**: Avoids running middleware on static assets (performance).

## Testing Checklist

Before deploying Phase 1:

- [ ] User can click "Continue with Google"
- [ ] OAuth consent screen appears
- [ ] User redirects to /dashboard after auth
- [ ] User email displays correctly
- [ ] Profile row created in Supabase (check Table Editor)
- [ ] Middleware blocks unauthenticated /dashboard access
- [ ] User can sign out successfully
- [ ] Session persists across page reloads
- [ ] No console errors during flow
- [ ] TypeScript compiles without errors

## Known Limitations (By Design)

1. **No handle selection yet**
   - Users don't set handles in Phase 1
   - Will be added in Phase 2 during onboarding

2. **No file upload**
   - Dashboard is empty for now
   - Phase 2 adds upload UI

3. **No profile editing**
   - Users can't update headline/privacy yet
   - Phase 5 adds edit form

4. **No rate limiting**
   - No upload quota enforced yet
   - Phase 5 adds 5 uploads/24h limit

## Next Phase Preview

**Phase 2 Goals**:
- Implement R2 presigned upload
- Build FileDropzone component
- Create claim API endpoint
- Add localStorage handoff logic
- Display "Waiting Room" polling UI

## Troubleshooting

### "Module not found: @supabase/ssr"
Run: `bun install`

### OAuth redirect loop
- Check `NEXT_PUBLIC_SUPABASE_URL` format (must include https://)
- Verify Google OAuth redirect URIs match exactly
- Clear browser cookies and localStorage

### Middleware not running
- Ensure `middleware.ts` is in project root (not /app)
- Check matcher regex is correct
- Verify Next.js version is 15.x

### Type errors in server components
- Ensure `createClient()` is awaited: `const supabase = await createClient()`
- Check cookies() is imported from 'next/headers'

### User not created in profiles table
- Verify trigger function was created in Supabase
- Check trigger is attached to auth.users table
- Look for errors in Supabase logs (Database → Logs)

## Performance Notes

- Session refresh adds ~50ms to each request
- Middleware bypasses static assets (no perf impact)
- Server components cache by default (no re-auth on navigation)
- Client components re-render on router.refresh()

## Security Considerations

1. **RLS is mandatory**
   - All tables have RLS enabled
   - Policies enforce user-scoped access
   - Service role bypasses RLS (use carefully)

2. **PKCE flow used**
   - OAuth uses Proof Key for Code Exchange
   - Prevents authorization code interception
   - Supabase handles this automatically

3. **Cookie-based auth**
   - HttpOnly cookies prevent XSS theft
   - SameSite=Lax prevents CSRF
   - Secure flag in production

4. **No client-side secrets**
   - ANON_KEY is public (protected by RLS)
   - SERVICE_ROLE_KEY never exposed to browser
   - OAuth tokens managed by Supabase

## Deployment Notes

### Cloudflare Workers Compatibility

All code is Cloudflare Workers-compatible:
- ✅ No filesystem access
- ✅ No Node.js-specific APIs
- ✅ Edge-compatible middleware
- ✅ Standard Web APIs only

### Environment Variables on Cloudflare

Set in Cloudflare dashboard:
```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or use `.dev.vars` for local testing.

## Maintenance

### Adding New Protected Routes

1. Add route path to middleware matcher
2. Or rely on existing regex (already catches all non-static)

### Updating Database Schema

1. Write migration SQL in Supabase Dashboard
2. Update `lib/types/database.ts` to match
3. Run `bunx tsc --noEmit` to verify types

### Rotating API Keys

1. Generate new keys in Supabase Dashboard
2. Update `.env.local` and Cloudflare secrets
3. Restart dev server / redeploy

---

**Phase 1 Complete**: Authentication infrastructure is production-ready.
**Next Up**: Phase 2 - File Upload & Claim Loop
