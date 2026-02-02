# Admin Dashboard Design

**Date:** 2026-02-02
**Status:** Approved
**Scope:** Read-only admin dashboard for platform metrics

---

## Overview

Add an admin dashboard to webresume.now for monitoring platform health, user activity, resume processing, and referral performance. Admin users can access both the normal user dashboard and the admin dashboard via a toggle.

### Goals

- Platform-wide visibility into users, resumes, traffic, referrals
- Monitor resume processing pipeline and identify failures
- Read-only v1 (no destructive actions)
- Match existing Neubrutalist "Paper & Ink" aesthetic

### Non-Goals (v1)

- User management actions (disable, delete, impersonate)
- Real-time updates (manual refresh only)
- Export functionality
- Audit logging

---

## Database Changes

### Schema Addition

Add `isAdmin` boolean to the `user` table:

```typescript
// lib/db/schema.ts - add to user table
isAdmin: integer("is_admin", { mode: "boolean" }).default(false),
```

### Migration

```sql
ALTER TABLE user ADD COLUMN is_admin INTEGER DEFAULT 0;
```

### Seeding Admin

After migration, set admin via D1:

```sql
UPDATE user SET is_admin = 1 WHERE email = 'admin@example.com';
```

---

## Auth & Access Control

### Admin Auth Helper

New helper in `lib/auth/admin.ts`:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { user as users } from "@/lib/db/schema";

export async function requireAdminAuth() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/");

  const user = await db.query.user.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!user?.isAdmin) redirect("/dashboard");
  return { session, user };
}
```

### UI Integration

In the existing header/nav component, conditionally render an "Admin" link for admin users:

```tsx
{user.isAdmin && (
  <Link href="/admin" className="...">
    Admin
  </Link>
)}
```

---

## Route Structure

### File Layout

```
app/
└── (admin)/
    └── admin/
        ├── layout.tsx          # Sidebar + header, runs requireAdminAuth()
        ├── page.tsx            # Overview (default landing)
        ├── users/
        │   └── page.tsx        # Paginated user list with search
        ├── resumes/
        │   └── page.tsx        # Resume status breakdown, failed queue
        ├── analytics/
        │   └── page.tsx        # Platform-wide traffic, top profiles
        └── referrals/
            └── page.tsx        # Leaderboard, conversion stats
```

### API Routes

```
app/api/admin/
├── stats/route.ts          # Overview metrics
├── users/route.ts          # Paginated user list with search
├── resumes/route.ts        # Resume status breakdown
├── analytics/route.ts      # Platform-wide traffic aggregates
└── referrals/route.ts      # Referral leaderboard
```

All API routes validate `isAdmin` before returning data.

---

## Page Designs

### Layout Shell (Sidebar + Header)

**Desktop Sidebar (w-64):**
- Logo/brand at top
- Navigation links with Lucide icons:
  - Overview: `LayoutDashboard`
  - Users: `Users`
  - Resumes: `FileText`
  - Analytics: `BarChart3`
  - Referrals: `Share2`
- Active state: `bg-slate-100` + coral left border accent
- Bottom: current admin email

**Mobile:**
- Hamburger menu in header
- Sidebar slides in as drawer
- Backdrop overlay when open

**Header:**
- Sticky: `sticky top-0 z-10 bg-white/80 backdrop-blur border-b`
- Dynamic page title
- "Back to Dashboard" link (returns to user dashboard)

### Overview Page

**Stat Cards (4-column grid):**
- Total users
- Published resumes (users with siteData)
- Resumes processing/queued
- Views today

**Recent Signups:**
- Last 10 users: email + relative time

**Failed Resumes Alert:**
- Count of failed resumes, links to /admin/resumes

**Sparkline:**
- 7-day view trend using uPlot

### Users Page

**Search:**
- Input field searching name, email, handle

**Table Columns:**
- Name/Email (stacked)
- Handle (with @ prefix, links to public profile)
- Status badge: Live (green), Processing (amber), No Resume (gray), Failed (red)
- Views (total pageViews)
- Joined (relative date)

**Pagination:**
- 25 users per page

### Resumes Page

**Stat Cards (4-column grid):**
- Completed (emerald)
- Processing (amber)
- Queued (blue)
- Failed (red)
- Cards are clickable to filter table

**Status Filter:**
- Dropdown: All / Completed / Processing / Queued / Failed

**Table Columns:**
- User (email)
- Status badge
- Attempts (retryCount/maxRetries)
- Error (truncated, tooltip for full)
- Time (relative)

**Failed Row Highlight:**
- `bg-red-50/50` background
- Expandable row for full error stack

### Analytics Page

**Period Toggle:**
- Segmented buttons: 7d / 30d / 90d

**Stat Cards (4-column grid):**
- Total views (with % change vs previous period)
- Unique visitors
- Average per day
- Profiles viewed

**Traffic Chart:**
- uPlot with two series: total views (solid) + unique (dashed)
- Area fill under total

**Top Profiles (ranked list):**
- Top 10 handles by view count
- Links to public profile

**Traffic Sources (horizontal bars):**
- Referrer domains with percentage bars

**Countries (list with flags):**
- Top 5 countries from CF GeoIP

**Devices (horizontal bars):**
- Desktop / Mobile / Tablet split

### Referrals Page

**Stat Cards (4-column grid):**
- Total referrers
- Total clicks
- Conversions (signups)
- Conversion rate

**Referral Funnel:**
- Horizontal bar visualization
- Clicks → Unique → Signups

**Top Referrers Table:**
- Rank (medals for top 3)
- User handle
- Clicks
- Conversions
- Conversion rate

**Click Sources:**
- Breakdown: homepage / cta / share

**Recent Conversions:**
- Last 10: new user → referrer + timestamp

---

## Styling Guidelines

### Design System (Neubrutalist "Paper & Ink")

**Colors:**
- Background: `#FDF8F3` (cream)
- Foreground: `#0D0D0D` (ink)
- Accent: `#FF6B6B` (coral)
- Card: `#FFFFFF`

**Shadows:**
- Cards: `shadow-depth-sm` (soft elevation)
- Hover: `shadow-depth-md` + `-translate-y-0.5`

**Cards:**
```css
bg-white rounded-2xl shadow-depth-sm border border-slate-200/60 p-6
hover:shadow-depth-md hover:-translate-y-0.5 transition-all duration-300
```

**Icon Backgrounds (gradient pairs):**
- Emerald → Teal (success/completed)
- Amber → Orange (processing/warning)
- Indigo → Blue (info/queued)
- Red → Pink (error/failed)
- Purple → Pink (referrals)

**Tables:**
- Inside white card
- Hover rows: `hover:bg-slate-50`
- Numbers: `font-variant-numeric: tabular-nums`

**Badges:**
- Use existing badge component with status colors

### Accessibility (Web Interface Guidelines)

- Semantic HTML: `<nav>`, `<main>`, `<header>`, `<table>`
- Skip link to main content
- `aria-current="page"` on active nav
- `aria-label` on icon buttons and search
- Focus-visible rings: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Proper heading hierarchy
- `tabular-nums` for number columns

### Data Loading

- Static fetch on page load
- Manual refresh button per page
- No auto-polling

---

## API Response Shapes

### GET /api/admin/stats

```typescript
{
  totalUsers: number;
  publishedResumes: number;
  processingResumes: number;
  viewsToday: number;
  recentSignups: Array<{ email: string; createdAt: string }>;
  failedResumes: number;
  dailyViews: Array<{ date: string; views: number }>;
}
```

### GET /api/admin/users?page=1&search=query

```typescript
{
  users: Array<{
    id: string;
    name: string;
    email: string;
    handle: string | null;
    status: 'live' | 'processing' | 'no_resume' | 'failed';
    views: number;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
}
```

### GET /api/admin/resumes?status=all&page=1

```typescript
{
  stats: {
    completed: number;
    processing: number;
    queued: number;
    failed: number;
  };
  resumes: Array<{
    id: string;
    userEmail: string;
    status: string;
    retryCount: number;
    lastAttemptError: string | null;
    updatedAt: string;
  }>;
  total: number;
  page: number;
}
```

### GET /api/admin/analytics?period=7d

```typescript
{
  totals: {
    views: number;
    unique: number;
    avgPerDay: number;
    profilesViewed: number;
  };
  changes: {
    views: number;      // percentage change
    unique: number;
    avgPerDay: number;
  };
  daily: Array<{ date: string; views: number; unique: number }>;
  topProfiles: Array<{ handle: string; views: number }>;
  referrers: Array<{ domain: string; count: number; percent: number }>;
  countries: Array<{ code: string; name: string; percent: number }>;
  devices: Array<{ type: string; percent: number }>;
}
```

### GET /api/admin/referrals

```typescript
{
  stats: {
    totalReferrers: number;
    totalClicks: number;
    conversions: number;
    conversionRate: number;
  };
  funnel: {
    clicks: number;
    unique: number;
    signups: number;
  };
  topReferrers: Array<{
    handle: string;
    clicks: number;
    conversions: number;
    rate: number;
  }>;
  sources: Array<{ source: string; percent: number }>;
  recentConversions: Array<{
    newUserEmail: string;
    referrerHandle: string;
    createdAt: string;
  }>;
}
```

---

## Implementation Notes

### Files to Create

1. **Schema migration** - Add `isAdmin` column
2. **Auth helper** - `lib/auth/admin.ts`
3. **Admin layout** - `app/(admin)/admin/layout.tsx`
4. **5 page components** - Overview, Users, Resumes, Analytics, Referrals
5. **5 API routes** - stats, users, resumes, analytics, referrals
6. **Shared components** - AdminSidebar, AdminHeader, StatCard, DataTable

### Reusable from Existing Codebase

- uPlot chart setup (from AnalyticsCard)
- Badge component
- Button component
- Input component
- Card styling patterns
- Stat card icon gradient pattern

### New Components Needed

- AdminSidebar (nav links with icons)
- AdminHeader (title + back link + mobile menu)
- DataTable (sortable, paginated table)
- StatCard (with optional % change indicator)
- HorizontalBarChart (CSS-only percentage bars)
- FunnelChart (stacked horizontal bars)

---

## Future Considerations (v2+)

- User actions: disable account, delete user, impersonate
- Resume actions: manual retry trigger, clear failed queue
- Export: CSV download for user list, analytics
- Notifications: alerts for spike in failures
- Audit log: track admin actions
- Role-based access: multiple admin levels
