# Manual Testing Checklist - webresume.now

Complete end-to-end testing checklist for verifying all functionality before production deployment.

---

## Test Environment Setup

### Prerequisites
- [ ] Clean browser session (incognito/private mode)
- [ ] Clear localStorage
- [ ] Test PDF resume file ready (2-3 pages recommended)
- [ ] Valid Google account for OAuth
- [ ] Network tab open in DevTools
- [ ] Console open for error monitoring

---

## 1. Anonymous User Flow (Pre-Auth)

### Homepage

- [ ] **Navigate to homepage**
  - [ ] Page loads without errors
  - [ ] Hero section displays correctly
  - [ ] Upload dropzone visible
  - [ ] "Login with Google" button present

### PDF Upload (Anonymous)

- [ ] **Upload PDF file**
  - [ ] Drag-and-drop works
  - [ ] Click to upload works
  - [ ] File type validation (only PDF accepted)
  - [ ] File size validation (max 10MB)
  - [ ] Progress indicator shows during upload

- [ ] **Verify R2 upload**
  - [ ] Network tab shows POST to `/api/upload/sign`
  - [ ] Response contains `uploadUrl` and `key`
  - [ ] PUT request to R2 succeeds (200 OK)
  - [ ] `temp_upload_id` saved to localStorage

- [ ] **Post-upload state**
  - [ ] Success message/toast displays
  - [ ] "Continue" or "Login with Google" button appears
  - [ ] Upload key persists in localStorage

### Error Scenarios

- [ ] **Upload invalid file type**
  - [ ] Error message: "Only PDF files allowed"
  - [ ] Upload prevented

- [ ] **Upload oversized file (>10MB)**
  - [ ] Error message: "File too large"
  - [ ] Upload prevented

- [ ] **Upload without internet**
  - [ ] Graceful error message
  - [ ] Retry option available

---

## 2. Authentication Flow

### Google OAuth

- [ ] **Click "Login with Google"**
  - [ ] Redirects to Google OAuth consent screen
  - [ ] Shows correct app name
  - [ ] Requests email permission

- [ ] **Grant permissions**
  - [ ] Redirects back to application
  - [ ] URL contains `/auth/callback`
  - [ ] No errors in console

- [ ] **Profile creation**
  - [ ] New user created in `auth.users` (check Supabase)
  - [ ] Profile row created in `profiles` table
  - [ ] Default handle generated (12-char MD5 hash)
  - [ ] Email populated
  - [ ] Privacy settings default: `{show_phone: false, show_address: false}`

- [ ] **Session established**
  - [ ] User session active (check DevTools > Application > Cookies)
  - [ ] Supabase auth cookie present
  - [ ] Redirects to `/onboarding`

### Error Scenarios

- [ ] **Cancel OAuth flow**
  - [ ] Returns to homepage
  - [ ] No errors thrown

- [ ] **OAuth fails (simulate by blocking popup)**
  - [ ] Error message displayed
  - [ ] Retry option available

---

## 3. Claim & Parse Flow

### Onboarding Page

- [ ] **Automatic claim attempt**
  - [ ] Page loads
  - [ ] Checks localStorage for `temp_upload_id`
  - [ ] POSTs to `/api/resume/claim` with key
  - [ ] Resume record created in database

- [ ] **Resume claimed successfully**
  - [ ] Status set to "processing"
  - [ ] Replicate job triggered
  - [ ] `replicate_id` stored in database
  - [ ] localStorage cleared

- [ ] **Redirect to waiting room**
  - [ ] Automatically redirects to `/waiting?resume_id={id}`
  - [ ] Resume ID in URL matches database

### Waiting Room

- [ ] **Polling starts**
  - [ ] GET requests to `/api/resume/status` every 3 seconds
  - [ ] Shows "Analyzing your resume..." message
  - [ ] Progress indicator animating

- [ ] **AI parsing in progress**
  - [ ] Status remains "processing"
  - [ ] Estimated time displayed (30-40 seconds)
  - [ ] No errors in console

- [ ] **Parsing completes**
  - [ ] Status changes to "completed"
  - [ ] `site_data` record created
  - [ ] Content JSON populated
  - [ ] Success message displays
  - [ ] "View Dashboard" button appears

- [ ] **Redirect to dashboard**
  - [ ] Click redirects to `/dashboard`
  - [ ] Dashboard loads with resume data

### Error Scenarios

- [ ] **No temp_upload_id in localStorage**
  - [ ] Shows "Upload a resume to get started"
  - [ ] Redirects to homepage

- [ ] **Parsing fails (Replicate error)**
  - [ ] Status changes to "failed"
  - [ ] Error message displayed
  - [ ] "Retry" button available
  - [ ] Retry button POSTs to `/api/resume/retry`

- [ ] **Timeout (90+ seconds)**
  - [ ] Shows timeout message
  - [ ] Retry option available
  - [ ] Contact support link (if implemented)

---

## 4. Dashboard

### Page Load

- [ ] **Dashboard displays**
  - [ ] Header shows "Dashboard" title
  - [ ] Welcome message with user's first name
  - [ ] Logout button present

### Resume Status Card

- [ ] **Status: Completed**
  - [ ] Green checkmark icon
  - [ ] "Resume published!" message
  - [ ] "Published" badge
  - [ ] "View Your Resume" button
  - [ ] "Copy Link" button

- [ ] **Copy link functionality**
  - [ ] Click copies `webresume.now/{handle}` to clipboard
  - [ ] Success toast displays
  - [ ] Link is valid

### Content Preview Card

- [ ] **Preview renders**
  - [ ] Full name displays
  - [ ] Headline displays
  - [ ] Summary truncated if >200 chars
  - [ ] "Read more" link if truncated

- [ ] **Stats display**
  - [ ] Experience count correct
  - [ ] Education count correct
  - [ ] Skills count correct
  - [ ] Certifications count correct

- [ ] **Last updated timestamp**
  - [ ] Relative time format ("2 hours ago")
  - [ ] Updates when data changes

- [ ] **Edit button**
  - [ ] Navigates to `/edit`

### Profile Completeness Card

- [ ] **Completeness calculation**
  - [ ] Percentage accurate
  - [ ] Progress bar reflects percentage
  - [ ] Color changes (yellow <70%, blue 70-89%, green 90-100%)

- [ ] **Suggestions**
  - [ ] Lists missing sections
  - [ ] Bullet points clear and actionable
  - [ ] No suggestions if 100% complete

### Quick Actions

- [ ] **Edit Resume Content**
  - [ ] Navigates to `/edit`

- [ ] **Privacy Settings**
  - [ ] Navigates to `/settings`

- [ ] **Upload New Resume**
  - [ ] Navigates to `/` (homepage)

- [ ] **Account Settings**
  - [ ] Navigates to `/settings`

### Account Information

- [ ] **Email displays**
  - [ ] Correct email shown

- [ ] **Handle link**
  - [ ] Format: `webresume.now/{handle}`
  - [ ] Clickable link
  - [ ] Opens public profile

- [ ] **Member since**
  - [ ] Relative timestamp accurate

---

## 5. Edit Flow

### Page Load

- [ ] **Edit form loads**
  - [ ] All fields populated with current data
  - [ ] Character counters show correct counts
  - [ ] Dynamic sections (experience, education) render
  - [ ] No console errors

### Form Validation

- [ ] **Required fields**
  - [ ] Full name: Required, shows error if empty
  - [ ] Headline: Required, max 100 chars
  - [ ] Summary: Required, max 500 chars
  - [ ] Email: Required, valid email format

- [ ] **Character limits**
  - [ ] Headline: Counter shows X/100
  - [ ] Summary: Counter shows X/500
  - [ ] Prevents typing beyond limit

- [ ] **Experience fields**
  - [ ] Title: Required
  - [ ] Company: Required
  - [ ] Start date: Required
  - [ ] End date: Optional (or "Present")
  - [ ] Description: Optional

- [ ] **Education fields**
  - [ ] Degree: Required
  - [ ] Institution: Required
  - [ ] Year: Required (numeric)

### Dynamic Fields

- [ ] **Add experience**
  - [ ] Click "Add Experience" button
  - [ ] New empty fields appear
  - [ ] Can add multiple entries

- [ ] **Remove experience**
  - [ ] Click remove button
  - [ ] Entry deleted
  - [ ] Confirmation if data present (optional)

- [ ] **Add education**
  - [ ] Click "Add Education" button
  - [ ] New fields appear

- [ ] **Remove education**
  - [ ] Click remove button
  - [ ] Entry deleted

- [ ] **Add skill**
  - [ ] Input field for skill name
  - [ ] Enter key adds skill
  - [ ] Skill appears as tag/chip

- [ ] **Remove skill**
  - [ ] Click X on skill tag
  - [ ] Skill removed

### Auto-Save

- [ ] **Auto-save triggers**
  - [ ] Type in any field
  - [ ] Wait 3 seconds
  - [ ] "Saving..." indicator appears
  - [ ] POST to `/api/resume/update`
  - [ ] Success toast: "Changes saved"

- [ ] **Consecutive edits**
  - [ ] Type, wait 3s, type again
  - [ ] Only one request sent after final change
  - [ ] Debounce works correctly

### Manual Save

- [ ] **Save button**
  - [ ] Click "Save Changes" button
  - [ ] Immediate save (no debounce)
  - [ ] Loading spinner on button
  - [ ] Success toast displays
  - [ ] Button re-enables

### Error Scenarios

- [ ] **Save fails (network error)**
  - [ ] Error toast displays
  - [ ] Form data not lost
  - [ ] Retry button available

- [ ] **Validation errors**
  - [ ] Red border on invalid fields
  - [ ] Error message below field
  - [ ] Save disabled until valid

- [ ] **Rate limit exceeded (11+ updates/hour)**
  - [ ] Error: "Too many requests"
  - [ ] Save blocked
  - [ ] Retry timer shown

---

## 6. Settings Flow

### Page Load

- [ ] **Settings form loads**
  - [ ] Current handle displayed
  - [ ] Privacy toggles reflect database state
  - [ ] Avatar/email shown
  - [ ] No console errors

### Handle Change

- [ ] **Valid handle update**
  - [ ] Enter new handle (3-30 chars, alphanumeric + underscore)
  - [ ] Click "Update Handle"
  - [ ] POST to `/api/profile/handle`
  - [ ] Success toast displays
  - [ ] Old handle → new handle redirect created in database
  - [ ] Old handle expires after 30 days

- [ ] **Handle validation**
  - [ ] Too short (<3 chars): Error message
  - [ ] Too long (>30 chars): Error message
  - [ ] Invalid characters: Error message
  - [ ] Already taken: Error message "Handle already in use"

### Privacy Settings

- [ ] **Show phone toggle**
  - [ ] Click toggle
  - [ ] Immediate UI update (optimistic)
  - [ ] POST to `/api/profile/privacy`
  - [ ] Success toast
  - [ ] Change persists on reload

- [ ] **Show address toggle**
  - [ ] Click toggle
  - [ ] Immediate UI update
  - [ ] POST to `/api/profile/privacy`
  - [ ] Success toast
  - [ ] Change reflects on public profile immediately

### Verify Privacy Filtering

- [ ] **Turn OFF "Show phone"**
  - [ ] Visit public profile (/{handle})
  - [ ] Phone number NOT visible
  - [ ] Verify in DOM (not just hidden with CSS)

- [ ] **Turn ON "Show phone"**
  - [ ] Visit public profile
  - [ ] Phone number visible

- [ ] **Turn OFF "Show address"**
  - [ ] Visit public profile
  - [ ] Only City, State shown (not full address)

- [ ] **Turn ON "Show address"**
  - [ ] Visit public profile
  - [ ] Full address visible

---

## 7. Public Profile Flow

### Basic Rendering

- [ ] **Navigate to /{handle}**
  - [ ] Page loads without errors
  - [ ] "Minimalist Creme" template renders
  - [ ] All sections visible

### Content Display

- [ ] **Header section**
  - [ ] Full name (large, bold)
  - [ ] Headline (below name)
  - [ ] Email (clickable mailto: link)
  - [ ] LinkedIn link (if present)
  - [ ] GitHub link (if present)
  - [ ] Phone (if show_phone = true)
  - [ ] Location/Address (respects show_address)

- [ ] **Summary section**
  - [ ] Full summary text
  - [ ] Proper paragraph formatting

- [ ] **Experience section**
  - [ ] All experience entries display
  - [ ] Title, company, dates
  - [ ] Description (if present)
  - [ ] Ordered by date (newest first)

- [ ] **Education section**
  - [ ] All education entries display
  - [ ] Degree, institution, year
  - [ ] Ordered by year (newest first)

- [ ] **Skills section**
  - [ ] All skills display
  - [ ] Styled as tags/chips
  - [ ] Properly wrapped

- [ ] **Certifications section** (if present)
  - [ ] All certifications display
  - [ ] Name, issuer, date

### Responsive Design

- [ ] **Desktop (>1024px)**
  - [ ] Layout clean and spacious
  - [ ] Proper spacing
  - [ ] Readable fonts

- [ ] **Tablet (768-1024px)**
  - [ ] Layout adapts
  - [ ] No horizontal scroll
  - [ ] Content readable

- [ ] **Mobile (<768px)**
  - [ ] Single column layout
  - [ ] Font sizes appropriate
  - [ ] Buttons/links tappable
  - [ ] No text overflow

### SEO & Metadata

- [ ] **View page source**
  - [ ] `<title>` tag: "{Full Name} - Resume"
  - [ ] Meta description present
  - [ ] Open Graph tags:
    - [ ] `og:title`
    - [ ] `og:description`
    - [ ] `og:url`
    - [ ] `og:type` (website)
  - [ ] No sensitive data in meta tags

### Invalid Handle

- [ ] **Navigate to /nonexistent**
  - [ ] 404 page displays
  - [ ] "Resume not found" message
  - [ ] Link back to homepage

### Redirects (Handle Changes)

- [ ] **Navigate to old handle**
  - [ ] Automatically redirects to new handle
  - [ ] 301 Permanent Redirect
  - [ ] New URL in browser

---

## 8. Security Testing

### Authentication

- [ ] **Access protected routes without auth**
  - [ ] `/dashboard` → redirects to `/`
  - [ ] `/edit` → redirects to `/`
  - [ ] `/settings` → redirects to `/`
  - [ ] `/waiting` → redirects to `/`
  - [ ] `/onboarding` → redirects to `/`

- [ ] **Access another user's data**
  - [ ] Log in as User A
  - [ ] Note User A's resume_id
  - [ ] Log out, log in as User B
  - [ ] Try GET `/api/resume/status?resume_id={User A's ID}`
  - [ ] Should return 403 Forbidden or empty result

### Input Validation

- [ ] **XSS attempts**
  - [ ] Enter `<script>alert('XSS')</script>` in headline
  - [ ] Save and view public profile
  - [ ] Script should NOT execute (sanitized by React)
  - [ ] Displays as plain text

- [ ] **SQL Injection (shouldn't be possible with Supabase)**
  - [ ] Enter `'; DROP TABLE profiles; --` in handle field
  - [ ] Should be rejected or escaped
  - [ ] No database damage

- [ ] **HTML Injection**
  - [ ] Enter `<h1>Big Text</h1>` in summary
  - [ ] Should render as plain text, not HTML
  - [ ] React escapes by default

### Rate Limiting

- [ ] **Upload rate limit**
  - [ ] Upload 5 resumes in quick succession
  - [ ] 6th upload should be blocked
  - [ ] Error: "Rate limit exceeded"
  - [ ] Check database: user has 5 resumes in last 24h

- [ ] **Update rate limit**
  - [ ] Edit resume content 10 times in an hour
  - [ ] 11th update should be blocked
  - [ ] Error: "Too many updates"

### CORS

- [ ] **Check R2 CORS**
  - [ ] Open DevTools Network tab
  - [ ] Upload file
  - [ ] PUT request to R2 should have:
    - [ ] `Access-Control-Allow-Origin` header
    - [ ] No CORS errors

---

## 9. Error Handling

### Network Errors

- [ ] **Offline mode**
  - [ ] Disconnect internet
  - [ ] Try to save edit
  - [ ] Error toast: "Network error"
  - [ ] Data not lost

- [ ] **Slow connection**
  - [ ] Throttle network to 3G (DevTools)
  - [ ] Upload PDF
  - [ ] Progress indicator shows
  - [ ] Eventually completes

### API Errors

- [ ] **500 Internal Server Error (simulate)**
  - [ ] Break API route temporarily
  - [ ] Trigger action (e.g., save)
  - [ ] Error boundary catches error
  - [ ] User-friendly error message
  - [ ] No app crash

### Replicate Errors

- [ ] **AI parsing fails**
  - [ ] Upload corrupted PDF or non-parseable file
  - [ ] Parsing should fail gracefully
  - [ ] Status: "failed"
  - [ ] Error message displayed
  - [ ] Retry button available

---

## 10. Performance Testing

### Page Load Times

- [ ] **Homepage**
  - [ ] Loads in <2 seconds
  - [ ] First contentful paint <1.5s

- [ ] **Dashboard**
  - [ ] Loads in <3 seconds
  - [ ] Shows skeleton during load

- [ ] **Public profile**
  - [ ] Loads in <2 seconds
  - [ ] Cached on repeat visits

### Bundle Size

- [ ] **Check build output**
  - [ ] Main bundle <110 kB
  - [ ] Largest page <220 kB total
  - [ ] Middleware <90 kB

### Database Queries

- [ ] **No N+1 queries**
  - [ ] Check Supabase logs
  - [ ] Single query per page load
  - [ ] Proper indexes used

---

## 11. User Experience

### Feedback & Notifications

- [ ] **Toast notifications**
  - [ ] Success: Green, checkmark icon
  - [ ] Error: Red, X icon
  - [ ] Info: Blue, info icon
  - [ ] Auto-dismiss after 3-5 seconds

- [ ] **Loading states**
  - [ ] Skeleton loaders on dashboard
  - [ ] Spinner on buttons during save
  - [ ] Progress bar on upload

### Navigation

- [ ] **Back button works**
  - [ ] Browser back button navigates correctly
  - [ ] No broken states

- [ ] **Breadcrumbs/clear paths**
  - [ ] Always know where you are
  - [ ] Easy to return to dashboard

### Accessibility (Basic)

- [ ] **Keyboard navigation**
  - [ ] Tab through form fields
  - [ ] Enter submits forms
  - [ ] Focus indicators visible

- [ ] **Screen reader (basic test)**
  - [ ] Buttons have aria-labels
  - [ ] Images have alt text
  - [ ] Form labels associated with inputs

---

## 12. Edge Cases

### Data Edge Cases

- [ ] **Empty education**
  - [ ] Resume with no education section
  - [ ] Dashboard should show "0 Education"
  - [ ] Public profile shows no education section (or "N/A")

- [ ] **No skills**
  - [ ] Resume with no skills
  - [ ] Should not break UI
  - [ ] Shows "Add skills to stand out" suggestion

- [ ] **Very long name (50+ chars)**
  - [ ] Enter extremely long name
  - [ ] Should truncate or wrap gracefully
  - [ ] No layout break

- [ ] **Special characters in name**
  - [ ] Name with accents (é, ñ, ü)
  - [ ] Name with apostrophe (O'Brien)
  - [ ] Should display correctly

### Upload Edge Cases

- [ ] **Upload PDF with 50+ pages**
  - [ ] Should accept (within 10MB limit)
  - [ ] Parsing may take longer
  - [ ] Should not crash

- [ ] **Upload 1-page resume**
  - [ ] Should parse correctly
  - [ ] No errors

- [ ] **Upload resume with no experience**
  - [ ] AI parsing handles gracefully
  - [ ] Fields empty or "N/A"

### Browser Edge Cases

- [ ] **Incognito mode**
  - [ ] Full flow works
  - [ ] localStorage accessible

- [ ] **Multiple tabs**
  - [ ] Edit in Tab 1
  - [ ] Refresh Tab 2
  - [ ] Changes reflected

- [ ] **Session timeout**
  - [ ] Leave logged in for 24+ hours
  - [ ] Try to save
  - [ ] Redirects to login or refreshes session

---

## Test Results Summary

### Overall Status
- [ ] **All critical flows working**
- [ ] **No blocking bugs**
- [ ] **Performance acceptable**
- [ ] **Security measures validated**

### Known Issues
- List any minor issues found (non-blocking)
- Note workarounds if applicable

### Recommendations
- Any improvements needed before launch
- Future enhancements to consider

---

## Sign-Off

**Tested by**: _______________
**Date**: _______________
**Environment**: [ ] Development  [ ] Staging  [ ] Production
**Overall Result**: [ ] PASS  [ ] FAIL  [ ] NEEDS FIXES

---

**Version**: 1.0
**Last Updated**: 2025-11-18
