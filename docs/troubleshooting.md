# Troubleshooting Guide - Phase 1 Authentication

## Common Issues and Solutions

### Installation Issues

#### "Cannot find module '@supabase/ssr'"

**Cause**: Dependencies not installed

**Solution**:
```bash
bun install
```

If still not working:
```bash
rm -rf node_modules bun.lock
bun install
```

#### "Module not found: Can't resolve '@/lib/supabase/client'"

**Cause**: Path alias not configured

**Solution**: Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Authentication Flow Issues

#### OAuth Redirect Loop

**Symptoms**: After clicking "Continue with Google", endless redirects

**Causes & Solutions**:

1. **Missing protocol in URL**
   ```bash
   # ❌ Wrong
   NEXT_PUBLIC_SUPABASE_URL=xxx.supabase.co
   
   # ✅ Correct
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   ```

2. **Redirect URI mismatch**
   - Go to Google Cloud Console → Credentials
   - Ensure authorized redirect URIs include:
     - http://localhost:3000/auth/callback (dev)
     - https://your-domain.com/auth/callback (prod)
     - Your Supabase callback URL

3. **Cached cookies**
   - Clear browser cookies for localhost
   - Clear localStorage
   - Try incognito mode

#### "Auth session missing" Error

**Cause**: Middleware not reading cookies properly

**Solution**:

1. Check `middleware.ts` exists in project root (NOT in `/app`)
2. Verify environment variables:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
3. Restart dev server:
   ```bash
   # Kill all Next.js processes
   pkill -f "next dev"
   
   # Restart
   bun run dev
   ```

#### User Not Redirected After Login

**Symptom**: Stuck on Google consent screen or blank page

**Solutions**:

1. Check browser console for errors
2. Verify `/auth/callback` route exists
3. Check Supabase logs:
   - Go to Supabase Dashboard
   - Click "Logs" → "Auth Logs"
   - Look for errors

4. Test callback manually:
   ```typescript
   // In browser console after OAuth
   console.log(window.location.href)
   // Should see: http://localhost:3000/auth/callback?code=...
   ```

### Database Issues

#### "relation 'profiles' does not exist"

**Cause**: Database schema not run

**Solution**:
1. Go to Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase-schema.sql`
3. Paste and run
4. Verify in Table Editor that all 4 tables exist

#### Profile Not Created After Signup

**Cause**: Trigger not working

**Solution**:

1. Check trigger exists:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

2. Re-create trigger:
   ```sql
   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
   ```

3. Test manually:
   ```sql
   -- Get your user ID from auth.users
   SELECT id, email FROM auth.users;
   
   -- Check if profile exists
   SELECT * FROM profiles WHERE id = 'your-user-id';
   ```

#### RLS Policy Errors

**Symptom**: "new row violates row-level security policy" or empty results

**Solution**:

1. Verify RLS is enabled:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables 
   WHERE schemaname = 'public';
   ```

2. Check policies exist:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

3. Test with service role key (bypasses RLS):
   ```typescript
   // Temporarily use service role to verify data exists
   const supabase = createServerClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!, // NEVER expose this!
     // ...
   )
   ```

### TypeScript Issues

#### "Cannot find name 'cookies'"

**Cause**: Wrong import or not using async

**Solution**:
```typescript
// ✅ Correct
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  // ...
}
```

#### "Property 'handle' does not exist on type 'Profile'"

**Cause**: Database types out of sync

**Solution**:

1. Update `lib/types/database.ts` to match schema
2. Regenerate types (if using Supabase CLI):
   ```bash
   supabase gen types typescript --project-id your-project-id > lib/types/database.ts
   ```

#### "'createClient' is not a function"

**Cause**: Wrong import

**Solution**:
```typescript
// ❌ Wrong
import createClient from '@/lib/supabase/client'

// ✅ Correct
import { createClient } from '@/lib/supabase/client'
```

### Middleware Issues

#### Middleware Not Running

**Symptoms**: Can access /dashboard without login

**Solutions**:

1. Ensure `middleware.ts` is in project root:
   ```bash
   ls -la /Users/divkix/GitHub/webresume.now/middleware.ts
   ```

2. Check matcher config:
   ```typescript
   export const config = {
     matcher: [
       '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     ],
   }
   ```

3. Clear `.next` cache:
   ```bash
   rm -rf .next
   bun run dev
   ```

#### "Error: Dynamic server usage"

**Symptom**: Build fails or runtime error about dynamic usage

**Solution**: Mark route segment as dynamic:
```typescript
// At top of page.tsx or route.ts
export const dynamic = 'force-dynamic'
```

### Environment Variable Issues

#### "Invalid API key"

**Cause**: Wrong key or not loaded

**Solutions**:

1. Verify `.env.local` exists in project root
2. Check file is not named `.env.local.txt` or `.env.local.example`
3. Restart dev server after changing env vars
4. Verify keys are correct:
   ```bash
   cat .env.local | grep SUPABASE
   ```

5. Test in browser console:
   ```javascript
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
   // Should NOT be undefined
   ```

#### "NEXT_PUBLIC_ variable undefined on server"

**Explanation**: This is expected. `NEXT_PUBLIC_` vars are for browser.

**Solution**: Use non-prefixed vars on server:
```typescript
// ✅ Server-side
process.env.SUPABASE_SERVICE_ROLE_KEY

// ✅ Client-side
process.env.NEXT_PUBLIC_SUPABASE_URL
```

### Build Issues

#### "Error: Cannot read properties of undefined (reading 'cookies')"

**Cause**: Using server client in client component

**Solution**:
```typescript
// ❌ Wrong
'use client'
import { createClient } from '@/lib/supabase/server'

// ✅ Correct
'use client'
import { createClient } from '@/lib/supabase/client'
```

#### Build succeeds but runtime errors

**Cause**: Environment variables not set in production

**Solution** (for Cloudflare):
```bash
# Set secrets
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY

# Or use .dev.vars for local testing
```

### Runtime Issues

#### "Failed to fetch" on login

**Cause**: CORS or network issue

**Solutions**:

1. Check Supabase is not paused (free tier auto-pauses)
2. Verify API URL is correct
3. Check browser network tab for actual error
4. Try from different network (not corporate firewall)

#### Session not persisting across page refreshes

**Cause**: Cookie configuration issue

**Solution**: Verify middleware is running (see above)

#### "Invalid refresh token" error

**Cause**: Expired session that can't be refreshed

**Solution**: Sign out and sign in again
```typescript
// In browser console
const supabase = createClient()
await supabase.auth.signOut()
```

### Testing Issues

#### Can't click login button

**Cause**: JavaScript not loaded or error

**Solutions**:

1. Check browser console for errors
2. Verify component is marked `'use client'`
3. Check component is imported in page:
   ```typescript
   import { LoginButton } from '@/components/auth/LoginButton'
   
   // In JSX
   <LoginButton />
   ```

#### Button clicks but nothing happens

**Solutions**:

1. Check browser console
2. Verify `NEXT_PUBLIC_SUPABASE_URL` is set
3. Test OAuth manually:
   ```javascript
   // In browser console
   const { createClient } = await import('@supabase/supabase-js')
   const supabase = createClient(
     'https://xxx.supabase.co',
     'your-anon-key'
   )
   await supabase.auth.signInWithOAuth({ provider: 'google' })
   ```

## Debugging Checklist

When something goes wrong, check in this order:

1. **Environment Variables**
   ```bash
   cat .env.local
   # Verify all 3 Supabase keys are present
   ```

2. **Dependencies**
   ```bash
   bun install
   # Re-install if needed
   ```

3. **Database**
   - Go to Supabase Table Editor
   - Verify all 4 tables exist
   - Check Auth → Users for your user

4. **TypeScript**
   ```bash
   bunx tsc --noEmit
   # Should have 0 errors
   ```

5. **Middleware**
   ```bash
   ls middleware.ts
   # Must be in project root
   ```

6. **Browser Console**
   - Open DevTools → Console
   - Look for red errors
   - Check Network tab for failed requests

7. **Supabase Logs**
   - Dashboard → Logs → Auth Logs
   - Look for errors or failed attempts

## Getting More Help

If issues persist:

1. Check full error message in:
   - Browser console (F12 → Console)
   - Terminal running dev server
   - Supabase Dashboard → Logs

2. Review documentation:
   - `/Users/divkix/GitHub/webresume.now/docs/phase1-auth.md`
   - `/Users/divkix/GitHub/webresume.now/docs/auth-quick-reference.md`

3. Test in isolation:
   - Create minimal test page
   - Test Supabase connection separately
   - Verify OAuth works with basic HTML

4. Common error patterns:
   - "Module not found" → Dependencies or paths
   - "Undefined" → Environment variables
   - "401/403" → Authentication/RLS
   - "Redirect loop" → OAuth configuration
   - "No session" → Middleware or cookies

## Clean Slate Reset

If all else fails, start fresh:

```bash
# 1. Clear all caches
rm -rf .next node_modules bun.lock
bun install

# 2. Reset local storage (in browser console)
localStorage.clear()

# 3. Clear cookies for localhost
# DevTools → Application → Cookies → Delete All

# 4. Verify environment
cat .env.local

# 5. Restart dev server
bun run dev

# 6. Try login in incognito mode
```

If still broken, check these files match the originals:
- `/Users/divkix/GitHub/webresume.now/lib/supabase/client.ts`
- `/Users/divkix/GitHub/webresume.now/lib/supabase/server.ts`
- `/Users/divkix/GitHub/webresume.now/middleware.ts`
