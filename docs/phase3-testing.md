# Phase 3: Resume Viewer Testing Guide

## Overview
Phase 3 implements the public resume viewer with the MinimalistCreme template, privacy filtering, and dynamic metadata for SEO.

## Prerequisites
- Local Supabase instance running
- Development server running (`bun run dev`)
- Database migrations applied
- Seed data loaded

---

## Setup Instructions

### 1. Start Local Supabase
```bash
cd /Users/divkix/GitHub/webresume.now
bun run db:start
```

Wait for Supabase to fully initialize. You should see:
```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
        anon key: ...
service_role key: ...
```

### 2. Reset Database with Seed Data
```bash
bun run db:reset
```

This will:
- Drop and recreate all tables
- Run migrations from `supabase/migrations`
- Execute seed data from `supabase/seed.sql`
- Create demo user with handle `demo`

### 3. Start Development Server
```bash
bun run dev
```

Server should start on: `http://localhost:3000`

---

## Test Scenarios

### Test 1: Demo Resume Page (Happy Path)

**URL**: `http://localhost:3000/demo`

**Expected Result**: Beautiful resume page with:
- ✅ Crème background (#FFFAF5)
- ✅ Avatar with "Alex Rivera" initials or Unsplash photo
- ✅ Name: "Alex Rivera"
- ✅ Headline: "Senior Full-Stack Engineer & Product Architect"
- ✅ Email link (clickable, opens mailto:)
- ✅ Location: "San Francisco, CA" (NOT full address "123 Tech Avenue...")
- ✅ LinkedIn, GitHub, Website links (all functional)
- ✅ Summary paragraph (200+ words)
- ✅ 3 Experience cards with:
  - Company names
  - Date ranges (e.g., "Mar 2021 — Present")
  - Bullet point highlights
  - Hover effects (shadow increases)
- ✅ Education card (UC Berkeley)
- ✅ Skills organized by category (5 categories)
  - Languages, Frontend, Backend, Infrastructure, Tools
  - Badge styling with amber theme
- ✅ Certifications (AWS certification with external link)
- ✅ Footer: "Built with webresume.now" link

**Privacy Verification**:
- ❌ Phone number should NOT appear (privacy_settings.show_phone = false)
- ❌ Full address should NOT appear (privacy_settings.show_address = false)
- ✅ Only "San Francisco, CA" visible

### Test 2: 404 - Non-Existent Handle

**URL**: `http://localhost:3000/nonexistent-handle`

**Expected Result**:
- ✅ Custom 404 page with crème background
- ✅ Large "404" text in amber
- ✅ "Resume Not Found" heading
- ✅ "Go to Homepage" button (links to `/`)
- ✅ "Get started" link in footer text

**SEO Metadata** (check with browser dev tools):
- Title: "Resume Not Found"
- Description: "The requested resume could not be found."

### Test 3: SEO Metadata Validation

**URL**: `http://localhost:3000/demo`

**Check with Browser Dev Tools** (View Page Source or Inspect `<head>`):

```html
<!-- Title -->
<title>Alex Rivera's Resume — webresume.now</title>

<!-- Meta Description (160 chars max) -->
<meta name="description" content="Innovative software engineer with 8+ years building scalable web applications and leading cross-functional teams. Specialized in TypeScript, React, and..." />

<!-- OpenGraph -->
<meta property="og:title" content="Alex Rivera — Senior Full-Stack Engineer & Product Architect" />
<meta property="og:description" content="..." />
<meta property="og:type" content="profile" />
<meta property="og:url" content="https://webresume.now/demo" />
<meta property="og:image" content="https://images.unsplash.com/photo-..." />
<meta property="og:image:width" content="400" />
<meta property="og:image:height" content="400" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Alex Rivera — Senior Full-Stack Engineer & Product Architect" />
<meta name="twitter:image" content="https://images.unsplash.com/photo-..." />
```

### Test 4: Responsive Design

Test on different viewport sizes:

**Desktop (1920px)**:
- ✅ Header: Avatar left, name/headline/links aligned left
- ✅ Max width: 4xl (896px centered)
- ✅ Experience cards: Full width with side-by-side layouts

**Tablet (768px)**:
- ✅ Header: Avatar still left of text
- ✅ Date ranges move to right side
- ✅ Cards remain single column

**Mobile (375px)**:
- ✅ Header: Avatar centered, text centered
- ✅ Contact links wrap properly
- ✅ Date ranges stack vertically
- ✅ Skills badges wrap to multiple rows
- ✅ All text remains readable (no overflow)

### Test 5: Privacy Filtering Deep Dive

**Setup**: Modify seed data privacy settings:

```sql
-- In Supabase Studio (http://127.0.0.1:54323)
-- Navigate to Table Editor → profiles → demo row
-- Edit privacy_settings column:

-- Test A: Show everything
{"show_phone": true, "show_address": true}

-- Test B: Hide phone only
{"show_phone": false, "show_address": true}

-- Test C: Hide address only
{"show_phone": true, "show_address": false}
```

**Test A** (show both):
- ✅ Phone appears: "+1 (555) 123-4567"
- ✅ Full address: "123 Tech Avenue, San Francisco, CA 94102"

**Test B** (hide phone):
- ❌ Phone does NOT appear
- ✅ Full address visible

**Test C** (hide address):
- ✅ Phone appears
- ✅ Only "San Francisco, CA" visible (street removed)

### Test 6: Link Functionality

Click each link and verify:

**Email** (`mailto:alex.rivera@example.com`):
- ✅ Opens default email client

**LinkedIn** (`https://linkedin.com/in/alexrivera`):
- ✅ Opens in new tab
- ✅ Has `rel="noopener noreferrer"`

**GitHub** (`https://github.com/alexrivera`):
- ✅ Opens in new tab

**Website** (`https://alexrivera.dev`):
- ✅ Opens in new tab

**Certification URL**:
- ✅ External link icon visible
- ✅ Opens AWS certification page

**Footer Link** (`webresume.now`):
- ✅ Links to homepage
- ✅ Amber hover state

### Test 7: Performance & Build

**Build Verification**:
```bash
bun run build
```

Expected output:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (10/10)

Route (app)                              Size  First Load JS
├ ƒ /[handle]                           2.4 kB         113 kB
```

**Lighthouse Scores** (run in Chrome DevTools):
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: 100

---

## Database Verification

### Check Seeded Data in Supabase Studio

**URL**: `http://127.0.0.1:54323`

**Navigate to Table Editor**:

1. **auth.users** table:
   - ✅ Row with email: `demo@webresume.now`
   - ✅ ID: `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`

2. **profiles** table:
   - ✅ Row with handle: `demo`
   - ✅ `privacy_settings`: `{"show_phone": false, "show_address": false}`
   - ✅ `headline`: "Senior Full-Stack Engineer & Product Architect"

3. **site_data** table:
   - ✅ Row with `user_id` matching demo user
   - ✅ `content` (jsonb): Full resume JSON
   - ✅ `theme_id`: "minimalist_creme"
   - ✅ `last_published_at`: Recent timestamp

### SQL Validation Queries

```sql
-- Verify demo user exists
SELECT id, email, handle FROM profiles WHERE handle = 'demo';

-- Verify site_data structure
SELECT
  content->>'full_name' as name,
  content->>'headline' as headline,
  jsonb_array_length(content->'experience') as experience_count,
  jsonb_array_length(content->'skills') as skill_categories
FROM site_data
WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Expected output:
-- name: "Alex Rivera"
-- headline: "Senior Full-Stack Engineer & Product Architect"
-- experience_count: 3
-- skill_categories: 5
```

---

## Common Issues & Troubleshooting

### Issue: "Resume Not Found" on /demo

**Cause**: Seed data not loaded or database reset failed

**Solution**:
```bash
# Check Supabase is running
bun run db:start

# Verify migrations
bun run db:migration:list

# Reset database
bun run db:reset

# Check Studio for data
# Visit http://127.0.0.1:54323
```

### Issue: TypeScript errors during build

**Cause**: Type mismatch in privacy_settings

**Solution**: Build should pass with type guard. If not:
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
bun run build
```

### Issue: Privacy filtering not working

**Cause**: Deep clone not working or type guard failing

**Debug**:
```typescript
// Add console.log in app/[handle]/page.tsx
console.log('Privacy Settings:', privacySettings)
console.log('Contact Before:', content.contact)
// After filtering
console.log('Contact After:', content.contact)
```

### Issue: Avatar not loading

**Cause**: Unsplash URL blocked or network issue

**Solution**: Avatar fallback (initials "AR") should appear automatically

---

## Success Criteria Checklist

Phase 3 is complete when:

- [x] Build passes without errors (`bun run build`)
- [x] Demo page renders at `/demo`
- [x] All sections visible: Header, Summary, Experience, Education, Skills, Certifications
- [x] Privacy filtering works (phone hidden, address filtered to city/state)
- [x] 404 page shows for invalid handles
- [x] SEO metadata generated correctly
- [x] Responsive on mobile/tablet/desktop
- [x] All links functional
- [x] Hover states work on cards and links
- [x] Footer attribution present

---

## Next Steps

After verifying Phase 3:

1. **Commit test results**: Document any edge cases found
2. **Prepare for Phase 4**: AI integration with Replicate
3. **Consider enhancements**:
   - Multiple theme support
   - Print stylesheet
   - PDF export button
   - Social share buttons

---

## Quick Test Checklist

Run through this in 2 minutes:

```bash
# 1. Reset database
bun run db:reset

# 2. Start dev server
bun run dev

# 3. Visit pages
open http://localhost:3000/demo          # Should load resume
open http://localhost:3000/invalid       # Should show 404

# 4. Build verification
bun run build                            # Should succeed

# 5. Check privacy
# Edit demo profile privacy_settings in Studio
# Refresh /demo and verify changes
```

---

**Documentation Version**: 1.0
**Last Updated**: 2025-11-18
**Phase**: 3 - Resume Viewer
**Status**: ✅ Complete
