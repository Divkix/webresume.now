# Wizard Components Usage Guide

This document provides implementation examples for the onboarding wizard components.

## Overview

The wizard consists of multiple steps that guide users through completing their profile:

1. **Step 1**: Role Selection (`Step1Role.tsx`)
2. **Step 2**: Headline Generator (`Step2Headline.tsx`)
3. **Step 3**: Summary Generator (`Step3Summary.tsx`)
4. **Step 4**: Experience Enhancement (TBD)

Each step is a standalone component that can be composed into a wizard flow.

## Component Architecture

### Step1Role
- Displays grid of career stage options
- Returns selected role ID when user clicks a card
- No back button (first step)

### Step2Headline
- Accepts role from Step 1
- Shows role-specific headline template as suggestion
- User can click suggestion to auto-fill or type manually
- Max 100 characters
- Has Back and Continue buttons

### Step3Summary
- Accepts role from Step 1
- Shows role-specific summary template as suggestion
- Textarea with character counter
- Min recommended: 50 chars, Max: 2000 chars
- Shows warning if below recommended length
- Has Back and Continue buttons

## Integration Example

```typescript
'use client'

import { useState } from 'react'
import { WizardProgress } from '@/components/wizard/WizardProgress'
import { Step1Role } from '@/components/wizard/Step1Role'
import { Step2Headline } from '@/components/wizard/Step2Headline'
import { Step3Summary } from '@/components/wizard/Step3Summary'

interface WizardData {
  role: string | null
  headline: string
  summary: string
}

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<WizardData>({
    role: null,
    headline: '',
    summary: '',
  })

  const TOTAL_STEPS = 6
  const progress = (currentStep / TOTAL_STEPS) * 100

  // Step 1 handlers
  const handleRoleSelect = (roleId: string) => {
    setData((prev) => ({ ...prev, role: roleId }))
    setCurrentStep(2)
  }

  // Step 2 handlers
  const handleHeadlineChange = (value: string) => {
    setData((prev) => ({ ...prev, headline: value }))
  }

  const handleHeadlineNext = () => {
    setCurrentStep(3)
  }

  const handleHeadlineBack = () => {
    setCurrentStep(1)
  }

  // Step 3 handlers
  const handleSummaryChange = (value: string) => {
    setData((prev) => ({ ...prev, summary: value }))
  }

  const handleSummaryNext = () => {
    // Save data to database or move to next step
    console.log('Wizard data:', data)
    // setCurrentStep(4)
  }

  const handleSummaryBack = () => {
    setCurrentStep(2)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Progress Bar */}
      <WizardProgress
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        progress={progress}
      />

      {/* Wizard Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        {currentStep === 1 && (
          <Step1Role onSelect={handleRoleSelect} />
        )}

        {currentStep === 2 && (
          <Step2Headline
            role={data.role}
            currentValue={data.headline}
            onChange={handleHeadlineChange}
            onNext={handleHeadlineNext}
            onBack={handleHeadlineBack}
          />
        )}

        {currentStep === 3 && (
          <Step3Summary
            role={data.role}
            currentValue={data.summary}
            onChange={handleSummaryChange}
            onNext={handleSummaryNext}
            onBack={handleSummaryBack}
          />
        )}
      </div>
    </div>
  )
}
```

## Component Props

### Step1Role
```typescript
interface Step1RoleProps {
  onSelect: (roleId: string) => void
}
```

### Step2Headline
```typescript
interface Step2HeadlineProps {
  role: string | null          // Selected role ID from Step 1
  currentValue?: string        // Pre-filled value (optional)
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}
```

### Step3Summary
```typescript
interface Step3SummaryProps {
  role: string | null          // Selected role ID from Step 1
  currentValue?: string        // Pre-filled value (optional)
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}
```

## State Management

The parent component should maintain wizard state:

```typescript
interface WizardData {
  role: string | null       // From Step 1
  headline: string          // From Step 2
  summary: string           // From Step 3
  // ... additional fields for future steps
}
```

## Validation Rules

### Step 2 (Headline)
- ✅ Required: Must have at least 1 character
- ✅ Max length: 100 characters
- ✅ Continue button disabled if empty

### Step 3 (Summary)
- ✅ Required: Must have at least 1 character
- ⚠️ Recommended: At least 50 characters
- ✅ Max length: 2000 characters
- ⚠️ Shows warning if below 50 characters (but allows proceeding)
- ✅ Continue button disabled if empty

## Design Features

Both Step 2 and Step 3 include:

- **Suggestion Box**: Indigo background with sparkles icon
- **Clickable Badges**: Template suggestions that auto-fill on click
- **Character Counter**: Real-time feedback with color coding
- **Navigation Buttons**: Consistent Back (outline) and Continue (gradient) styling
- **Help Text**: "Step X of 6 — You can edit this later"
- **Responsive Design**: Mobile-first with proper spacing

## Navigation Flow

```
Step 1 (Role)
    ↓
Step 2 (Headline)
    ↓
Step 3 (Summary)
    ↓
Step 4 (Experience) [TBD]
    ↓
... additional steps
```

Users can:
- Move forward by clicking "Continue" (when valid)
- Move backward by clicking "Back"
- Edit data from previous steps by going back

## Tips for Implementation

1. **Preserve State**: Store wizard data in state or database to allow users to resume later
2. **Validation**: Each step validates its own data before allowing continuation
3. **Templates**: Role templates are loaded from `@/lib/onboarding/role-templates`
4. **Error Handling**: Components handle null role gracefully with fallback UI
5. **Accessibility**: All inputs have proper labels and ARIA attributes
6. **Responsive**: Works on mobile, tablet, and desktop

## Database Integration

When the wizard is complete, save the data:

```typescript
const handleWizardComplete = async () => {
  const response = await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: data.role,
      headline: data.headline,
      // Update profile table
    }),
  })

  const siteResponse = await fetch('/api/site-data', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: {
        summary: data.summary,
        // Update site_data content JSON
      },
    }),
  })

  // Redirect to dashboard
  router.push('/dashboard')
}
```

## Testing

Test each component independently:

```typescript
// Test Step 2
<Step2Headline
  role="junior_professional"
  currentValue="Full-Stack Developer | React & Node.js"
  onChange={(value) => console.log('Headline:', value)}
  onNext={() => console.log('Next clicked')}
  onBack={() => console.log('Back clicked')}
/>

// Test Step 3
<Step3Summary
  role="junior_professional"
  currentValue="Results-driven developer with 2 years of experience..."
  onChange={(value) => console.log('Summary:', value)}
  onNext={() => console.log('Next clicked')}
  onBack={() => console.log('Back clicked')}
/>
```

## Next Steps

Future wizard steps to implement:
- Step 4: Experience Enhancement
- Step 5: Skills & Education
- Step 6: Contact & Links
- Final Review Page
