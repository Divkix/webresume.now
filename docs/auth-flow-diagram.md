# Authentication Flow Diagram

## Complete OAuth Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Journey                                 │
└─────────────────────────────────────────────────────────────────────┘

1. LANDING PAGE
   ┌─────────────┐
   │   page.tsx  │
   │   (public)  │
   └──────┬──────┘
          │
          │ User clicks
          ▼
   ┌──────────────────┐
   │  LoginButton.tsx │  ← Client Component
   │  'use client'    │
   └──────┬───────────┘
          │
          │ createClient() from @/lib/supabase/client
          ▼
   ┌─────────────────────────────────────┐
   │ supabase.auth.signInWithOAuth()     │
   │ provider: 'google'                  │
   │ redirectTo: /auth/callback          │
   └──────┬──────────────────────────────┘
          │
          │ Browser redirects to Google
          ▼

2. GOOGLE OAUTH
   ┌─────────────────────┐
   │  Google Consent     │
   │  Screen             │
   │  (user approves)    │
   └──────┬──────────────┘
          │
          │ Google redirects back with code
          ▼
   /auth/callback?code=xxx

3. CALLBACK HANDLER
   ┌───────────────────────────────────┐
   │  app/(auth)/auth/callback/route.ts│
   │  (Server Component)               │
   └──────┬────────────────────────────┘
          │
          │ const supabase = await createClient()
          │ from @/lib/supabase/server
          ▼
   ┌─────────────────────────────────────┐
   │ supabase.auth.exchangeCodeForSession│
   │ (converts code to session)          │
   └──────┬──────────────────────────────┘
          │
          │ Sets auth cookies
          │ (handled by middleware)
          ▼
   ┌─────────────────────┐
   │  Trigger: Database  │
   │  Creates profile row│
   └──────┬──────────────┘
          │
          │ Redirects to /onboarding
          ▼

4. ONBOARDING PAGE
   ┌─────────────────────────────────────┐
   │ app/(protected)/onboarding/page.tsx │
   │ (Server Component)                  │
   └──────┬──────────────────────────────┘
          │
          │ Middleware checks auth
          │ ┌────────────────────┐
          │ │ middleware.ts      │
          │ │ updateSession()    │
          │ └────────────────────┘
          │
          │ Currently redirects to /dashboard
          │ (Phase 2 will add claim logic)
          ▼

5. DASHBOARD
   ┌────────────────────────────────────┐
   │ app/(protected)/dashboard/page.tsx │
   │ (Server Component)                 │
   └──────┬─────────────────────────────┘
          │
          │ const supabase = await createClient()
          ▼
   ┌─────────────────────────────┐
   │ supabase.auth.getUser()     │
   │ (from cookie session)       │
   └──────┬──────────────────────┘
          │
          │ Fetch profile from DB
          ▼
   ┌─────────────────────────────┐
   │ Display:                    │
   │ - Email                     │
   │ - Handle (if set)           │
   │ - Logout button             │
   └─────────────────────────────┘

6. LOGOUT
   ┌──────────────────┐
   │ LogoutButton.tsx │
   │ 'use client'     │
   └──────┬───────────┘
          │
          │ const supabase = createClient()
          │ from @/lib/supabase/client
          ▼
   ┌──────────────────────────┐
   │ supabase.auth.signOut()  │
   │ (clears cookies)         │
   └──────┬───────────────────┘
          │
          │ router.push('/')
          │ router.refresh()
          ▼
   Back to landing page
```

## Session Management

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Every Request Flow                                │
└─────────────────────────────────────────────────────────────────────┘

Request to any page
   │
   ▼
┌────────────────────────┐
│  middleware.ts         │
│  (runs on every req)   │
└──────┬─────────────────┘
       │
       │ import { updateSession }
       │ from @/lib/supabase/middleware
       ▼
┌─────────────────────────────────┐
│ Check if session expired?       │
│ - Read cookies                  │
│ - Call supabase.auth.getUser()  │
│ - Refresh if needed             │
└──────┬──────────────────────────┘
       │
       ├─ Protected route? (/dashboard, /onboarding)
       │  └─ No user? → Redirect to '/'
       │  └─ User exists? → Continue
       │
       └─ Public route? → Continue
```

## Client Types

```
┌─────────────────────────────────────────────────────────────────────┐
│                   Three Supabase Clients                            │
└─────────────────────────────────────────────────────────────────────┘

1. BROWSER CLIENT
   lib/supabase/client.ts
   ┌────────────────────────────┐
   │ createBrowserClient()      │
   │ - Used in 'use client'     │
   │ - OAuth redirects          │
   │ - Client-side auth state   │
   └────────────────────────────┘
   
   Usage:
   'use client'
   import { createClient } from '@/lib/supabase/client'
   const supabase = createClient()

2. SERVER CLIENT
   lib/supabase/server.ts
   ┌────────────────────────────┐
   │ createServerClient()       │
   │ - Used in Server Comps     │
   │ - API routes               │
   │ - Cookie management        │
   │ - Must await creation      │
   └────────────────────────────┘
   
   Usage:
   import { createClient } from '@/lib/supabase/server'
   const supabase = await createClient()

3. MIDDLEWARE CLIENT
   lib/supabase/middleware.ts
   ┌────────────────────────────┐
   │ updateSession()            │
   │ - Session refresh          │
   │ - Cookie updates           │
   │ - Returns user + response  │
   └────────────────────────────┘
   
   Usage:
   import { updateSession } from '@/lib/supabase/middleware'
   const { supabaseResponse, user } = await updateSession(request)
```

## Database Interaction

```
┌─────────────────────────────────────────────────────────────────────┐
│                Database Query Flow                                  │
└─────────────────────────────────────────────────────────────────────┘

Server Component
   │
   ▼
const supabase = await createClient()
   │
   ▼
const { data: { user } } = await supabase.auth.getUser()
   │
   ├─ No user? → redirect('/')
   │
   └─ User exists
      │
      ▼
   const { data, error } = await supabase
     .from('profiles')
     .select('*')
     .eq('id', user.id)
     .single()
      │
      ├─ RLS POLICY CHECKS
      │  ┌──────────────────────────────┐
      │  │ Is auth.uid() = user.id?     │
      │  │ YES → Return data            │
      │  │ NO  → Return empty/error     │
      │  └──────────────────────────────┘
      │
      ▼
   Render with data
```

## Type Safety Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Type System                                      │
└─────────────────────────────────────────────────────────────────────┘

lib/types/database.ts
   │
   ├─ Database interface
   │  └─ Tables
   │     ├─ profiles
   │     │  ├─ Row    (SELECT)
   │     │  ├─ Insert (INSERT)
   │     │  └─ Update (UPDATE)
   │     ├─ resumes
   │     ├─ site_data
   │     └─ redirects
   │
   └─ ResumeContent interface
      └─ AI parsing output structure

Usage in code:
   │
   ▼
import { Database, ResumeContent } from '@/lib/types/database'
   │
   ▼
type Profile = Database['public']['Tables']['profiles']['Row']
   │
   ▼
const profile: Profile = { ... }
   │
   └─ Full autocomplete + type checking
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────────┐
│              Security Implementation                                │
└─────────────────────────────────────────────────────────────────────┘

Layer 1: MIDDLEWARE
   ┌────────────────────────────────┐
   │ Route protection               │
   │ /dashboard → requires auth     │
   │ /onboarding → requires auth    │
   └────────────────────────────────┘

Layer 2: SERVER COMPONENTS
   ┌────────────────────────────────┐
   │ Double-check auth status       │
   │ if (!user) redirect('/')       │
   └────────────────────────────────┘

Layer 3: ROW LEVEL SECURITY (RLS)
   ┌────────────────────────────────┐
   │ Database-level policies        │
   │ auth.uid() = user_id           │
   │ Blocks unauthorized queries    │
   └────────────────────────────────┘

Layer 4: COOKIE SECURITY
   ┌────────────────────────────────┐
   │ HttpOnly → No XSS theft        │
   │ SameSite → No CSRF             │
   │ Secure → HTTPS only (prod)     │
   └────────────────────────────────┘

Layer 5: PKCE FLOW
   ┌────────────────────────────────┐
   │ OAuth code challenge           │
   │ Prevents code interception     │
   │ Managed by Supabase            │
   └────────────────────────────────┘
```

## Error Handling

```
┌─────────────────────────────────────────────────────────────────────┐
│              Error Flow                                             │
└─────────────────────────────────────────────────────────────────────┘

OAuth Error
   │
   ▼
exchangeCodeForSession(code) fails
   │
   ├─ Log error to console
   │
   └─ Redirect to /?error=auth_failed
      │
      └─ Landing page can show error message

Database Error
   │
   ▼
const { data, error } = await supabase.from('profiles')...
   │
   ├─ Check if (error)
   │
   ├─ Log error
   │
   └─ Return fallback UI / redirect

Session Expired
   │
   ▼
Middleware detects expired session
   │
   ├─ Attempts refresh
   │  ├─ Success → Update cookies, continue
   │  └─ Fail → Clear cookies, redirect
   │
   └─ For protected routes → redirect to '/'
```

---

This diagram shows the complete authentication architecture for Phase 1.
