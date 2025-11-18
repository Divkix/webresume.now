# Authentication Quick Reference

## Importing Supabase Clients

```typescript
// In client components (marked with 'use client')
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()

// In server components and API routes (async)
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// In middleware.ts
import { updateSession } from '@/lib/supabase/middleware'
const { supabaseResponse, user } = await updateSession(request)
```

## Common Patterns

### Check if User is Authenticated (Server)

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }
  
  // User is authenticated
}
```

### Check if User is Authenticated (Client)

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function Component() {
  const [user, setUser] = useState(null)
  const supabase = createClient()
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })
  }, [])
  
  if (!user) return <div>Please log in</div>
  return <div>Welcome {user.email}</div>
}
```

### Fetch User Profile

```typescript
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()
```

### Update User Profile

```typescript
const { error } = await supabase
  .from('profiles')
  .update({ 
    handle: 'johndoe',
    headline: 'Full-stack developer'
  })
  .eq('id', user.id)
```

### Sign Out

```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const router = useRouter()
const supabase = createClient()

await supabase.auth.signOut()
router.push('/')
router.refresh()
```

## Database Query Examples

### Insert Resume

```typescript
const { data, error } = await supabase
  .from('resumes')
  .insert({
    user_id: user.id,
    r2_key: 'users/123/resume.pdf',
    status: 'processing'
  })
  .select()
  .single()
```

### Update Resume Status

```typescript
const { error } = await supabase
  .from('resumes')
  .update({ status: 'completed' })
  .eq('id', resumeId)
```

### Fetch User's Latest Resume

```typescript
const { data: resume, error } = await supabase
  .from('resumes')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

### Create/Update Site Data

```typescript
const { error } = await supabase
  .from('site_data')
  .upsert({
    user_id: user.id,
    content: resumeJson,
    theme_id: 'minimalist_creme'
  })
```

### Lookup User by Handle

```typescript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*, site_data(*)')
  .eq('handle', 'johndoe')
  .single()
```

## Type Usage

```typescript
import { Database, ResumeContent } from '@/lib/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Resume = Database['public']['Tables']['resumes']['Row']

const content: ResumeContent = {
  full_name: 'John Doe',
  headline: 'Software Engineer',
  summary: '...',
  contact: {
    email: 'john@example.com',
    phone: '123-456-7890'
  },
  experience: [...]
}
```

## Environment Variables

```bash
# Required for Phase 1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

## Useful Commands

```bash
# Install dependencies
bun install

# Run dev server
bun run dev

# Type check
bunx tsc --noEmit

# Build for production
bun run build

# Deploy to Cloudflare
npx wrangler deploy
```

## Error Handling

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single()

if (error) {
  console.error('Error fetching profile:', error)
  return // Handle error appropriately
}

// Use data safely
```

## RLS Notes

- **anon key**: Respects RLS policies (safe for client)
- **service_role key**: Bypasses RLS (server-only!)
- All queries automatically scoped to authenticated user
- Use `.eq('user_id', user.id)` as best practice anyway

## Common Gotchas

1. **Forgot to await createClient()**
   ```typescript
   // ❌ Wrong
   const supabase = createClient()
   
   // ✅ Correct (in server components)
   const supabase = await createClient()
   ```

2. **Using server client in client component**
   ```typescript
   // ❌ Wrong
   'use client'
   import { createClient } from '@/lib/supabase/server'
   
   // ✅ Correct
   'use client'
   import { createClient } from '@/lib/supabase/client'
   ```

3. **Not handling null user**
   ```typescript
   // ❌ Wrong
   const profile = await supabase.from('profiles').select('*').eq('id', user.id)
   
   // ✅ Correct
   if (!user) redirect('/')
   const profile = await supabase.from('profiles').select('*').eq('id', user.id)
   ```

4. **Forgetting router.refresh() after mutations**
   ```typescript
   // ❌ Wrong
   await supabase.auth.signOut()
   router.push('/')
   
   // ✅ Correct
   await supabase.auth.signOut()
   router.push('/')
   router.refresh() // Clear server cache
   ```
