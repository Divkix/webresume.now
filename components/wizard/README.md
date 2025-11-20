# Wizard Components

Production-ready wizard components for the webresume.now onboarding flow.

## Components

### Step2Headline (`Step2Headline.tsx`)
Professional headline generator with role-based suggestions.

**Features:**
- Role-specific template suggestions (e.g., "Junior Developer | React Specialist")
- Clickable badge to auto-fill template
- Manual input field with character counter
- Max 100 characters
- Real-time validation
- Smooth transitions and gradient buttons

**Design:**
- Indigo suggestion box with sparkles icon
- Large input field for prominent display
- Character counter with color-coded warnings
- Navigation: Back + Continue buttons
- Help text: "Step 2 of 6"

**Props:**
```typescript
{
  role: string | null          // Selected role from Step 1
  currentValue?: string        // Pre-filled value
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}
```

**Validation:**
- Required: At least 1 character
- Max length: 100 characters
- Continue disabled until valid

---

### Step3Summary (`Step3Summary.tsx`)
Professional summary generator with role-based templates.

**Features:**
- Role-specific summary templates with placeholders
- Clickable badge to auto-fill template
- Textarea with auto-expand
- Character counter with recommendations
- Warning alert if below 50 characters
- Max 2000 characters
- Real-time validation

**Design:**
- Similar indigo suggestion box
- Multi-line textarea (6 rows default)
- Character counter with recommendation hint
- Warning alert for short summaries
- Pro tips section (when no template)
- Navigation: Back + Continue buttons
- Help text: "Step 3 of 6"

**Props:**
```typescript
{
  role: string | null          // Selected role from Step 1
  currentValue?: string        // Pre-filled value
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}
```

**Validation:**
- Required: At least 1 character
- Recommended: 50-500 characters
- Max length: 2000 characters
- Warning shown if < 50 chars (but allows proceeding)
- Continue disabled until valid

---

## Design System

Both components follow the **Soft Depth** theme:

### Colors
- Background: `bg-slate-50` (page)
- Cards: `bg-white` with `border-slate-200`
- Suggestions: `bg-indigo-50` with `border-indigo-200`
- Gradient buttons: `from-indigo-600 to-blue-600`
- Text: `text-slate-900` (primary), `text-slate-600` (secondary)

### Shadows
- Cards: `shadow-lg`
- Buttons: `shadow-lg` → `shadow-xl` on hover

### Typography
- Heading: `text-3xl sm:text-4xl font-bold`
- Subheading: `text-lg text-slate-600`
- Labels: `text-sm font-semibold`
- Helper text: `text-xs text-slate-500`

### Spacing
- Card padding: `p-8`
- Section spacing: `space-y-6`
- Rounded corners: `rounded-2xl` (cards), `rounded-xl` (suggestions)

### Transitions
- All interactive elements: `transition-all duration-300`
- Smooth hover effects on buttons and suggestions

---

## Usage

Import from the barrel export:

```typescript
import { Step2Headline, Step3Summary } from '@/components/wizard'
```

See `USAGE.md` for complete integration examples.

---

## Role Templates

Templates are loaded from `@/lib/onboarding/role-templates.ts`:

**Available Roles:**
- `student`: University students
- `recent_graduate`: Graduated within 2 years
- `junior_professional`: 0-3 years experience
- `mid_level_professional`: 3-7 years experience
- `senior_professional`: 7+ years experience
- `freelancer`: Independent contractors

Each role has:
- `headlineTemplate`: Placeholder-based headline
- `summaryTemplate`: Placeholder-based summary
- `experienceDescriptionGuidance`: Tips for experience section

**Example templates:**

```typescript
// Junior Professional
headlineTemplate: "Junior {Role} | {Specialization}"
summaryTemplate: "Results-driven {role} with {years} years of experience in {industry}. Skilled in {skills}."

// Senior Professional
headlineTemplate: "Senior {Role} | {Specialization} Leader"
summaryTemplate: "Strategic {role} with {years}+ years leading high-performing teams. Deep expertise in {skills}."
```

---

## Error Handling

Both components handle edge cases gracefully:

1. **Null role**: Shows generic tips instead of suggestions
2. **Empty role**: No template loaded, pro tips displayed
3. **Invalid role ID**: Falls back to generic UI
4. **Long text**: Enforces max length, blocks additional input
5. **Short summary**: Shows warning but allows proceeding

---

## Accessibility

- All inputs have proper labels with `htmlFor` attributes
- Character counters use semantic text
- Warning alerts use Alert component with proper ARIA
- Buttons are properly disabled with visual feedback
- Color contrast meets WCAG AA standards

---

## Performance

- Components use `useState` for local state
- `useEffect` syncs local state to parent on change
- No unnecessary re-renders
- Smooth 300ms transitions via CSS
- Character counting is O(1) (string.length)

---

## Testing

### Manual Testing
1. Test with each role type
2. Verify suggestions populate correctly
3. Test character limits (type past limit)
4. Verify validation (empty state, short summary)
5. Test navigation (Back/Continue buttons)
6. Test responsive design (mobile, tablet, desktop)

### Edge Cases
- Empty role → Generic UI
- Very long names → Truncation
- Special characters → Handled correctly
- Paste large text → Enforces max length

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Files

```
components/wizard/
├── Step1Role.tsx           # Role selection (existing)
├── Step2Headline.tsx       # Headline generator (NEW)
├── Step3Summary.tsx        # Summary generator (NEW)
├── WizardProgress.tsx      # Progress bar (existing)
├── index.ts                # Barrel export
├── USAGE.md                # Integration examples
└── README.md               # This file
```

---

## Next Steps

Future enhancements:
- [ ] Step 4: Experience Enhancement
- [ ] Step 5: Skills & Education
- [ ] Step 6: Contact & Links
- [ ] AI-powered suggestion refinement
- [ ] A/B test different suggestion formats
- [ ] Analytics tracking for completion rates

---

## Dependencies

**UI Components:**
- `@/components/ui/input`
- `@/components/ui/textarea`
- `@/components/ui/button`
- `@/components/ui/badge`
- `@/components/ui/alert`

**Icons:**
- `lucide-react` (Sparkles, ArrowLeft, ArrowRight, AlertCircle)

**Data:**
- `@/lib/onboarding/role-templates`

---

Built with Next.js 15 + TypeScript + Tailwind CSS
