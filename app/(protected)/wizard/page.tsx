'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ResumeContent } from '@/lib/types/database'
import {
  WizardProgress,
  Step1Role,
  Step2Headline,
  Step3Summary,
  Step4Experience,
} from '@/components/wizard'
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface WizardState {
  currentStep: number
  resumeData: ResumeContent | null
  selectedRole: string | null
  formData: {
    headline: string
    summary: string
    experience_updates: Array<{ index: number; description: string }>
  }
}

const TOTAL_STEPS = 4

/**
 * Wizard Page - Multi-step onboarding flow
 * Guides users through completing their profile after AI parsing
 *
 * Steps:
 * 1. Role Selection - Choose career stage
 * 2. Headline Generation - Create professional headline
 * 3. Summary Enhancement - Polish professional summary
 * 4. Experience Polish - Enhance job descriptions
 */
export default function WizardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    resumeData: null,
    selectedRole: null,
    formData: {
      headline: '',
      summary: '',
      experience_updates: [],
    },
  })

  // Fetch resume data on mount
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // 1. Check authentication
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push('/')
          return
        }

        // 2. Fetch site_data (contains parsed resume content)
        const { data: siteData, error: fetchError } = await supabase
          .from('site_data')
          .select('content')
          .eq('user_id', user.id)
          .single()

        if (fetchError || !siteData) {
          setError('No resume data found. Please upload a resume first.')
          setTimeout(() => router.push('/dashboard'), 2000)
          return
        }

        const content = siteData.content as unknown as ResumeContent

        // 3. Check if wizard is needed
        // Skip if all critical fields are complete
        const hasHeadline = content.headline?.trim().length > 0
        const hasSummary = content.summary?.trim().length > 0
        const hasDescriptions = content.experience?.every(
          (exp) => exp.description?.trim().length > 0
        )

        if (hasHeadline && hasSummary && hasDescriptions) {
          // Profile is already complete, redirect to dashboard
          toast.success('Your profile is already complete!')
          router.push('/dashboard')
          return
        }

        // 4. Load resume data into state
        setState((prev) => ({
          ...prev,
          resumeData: content,
          formData: {
            headline: content.headline || '',
            summary: content.summary || '',
            experience_updates: [],
          },
        }))
      } catch (err) {
        console.error('Error fetching resume data:', err)
        setError('Failed to load resume data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchResumeData()
  }, [router])

  // Handler for role selection (Step 1)
  const handleRoleSelect = (roleId: string) => {
    setState((prev) => ({
      ...prev,
      selectedRole: roleId,
      currentStep: 2,
    }))
  }

  // Handler for headline change (Step 2)
  const handleHeadlineChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, headline: value },
    }))
  }

  // Handler for headline next (Step 2)
  const handleHeadlineNext = () => {
    setState((prev) => ({ ...prev, currentStep: 3 }))
  }

  // Handler for summary change (Step 3)
  const handleSummaryChange = (value: string) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, summary: value },
    }))
  }

  // Handler for summary next (Step 3)
  const handleSummaryNext = () => {
    setState((prev) => ({ ...prev, currentStep: 4 }))
  }

  // Handler for wizard completion (Step 4)
  const handleComplete = async (
    experienceUpdates: Array<{ index: number; description: string }>
  ) => {
    try {
      // Update local state
      setState((prev) => ({
        ...prev,
        formData: { ...prev.formData, experience_updates: experienceUpdates },
      }))

      // Call wizard completion API
      const response = await fetch('/api/wizard/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: state.selectedRole,
          headline: state.formData.headline,
          summary: state.formData.summary,
          experience_updates: experienceUpdates,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save changes')
      }

      // Show success message and redirect
      toast.success('Profile completed successfully!')
      router.push('/dashboard')
    } catch (err) {
      console.error('Error completing wizard:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to complete setup'
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  // Handler for back navigation
  const handleBack = (targetStep: number) => {
    setState((prev) => ({ ...prev, currentStep: targetStep }))
  }

  // Calculate progress percentage
  const progress = (state.currentStep / TOTAL_STEPS) * 100

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading your resume...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && state.currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-depth-md border border-red-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Something Went Wrong
          </h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  // Main wizard UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50">
      {/* Progress Indicator */}
      <WizardProgress
        currentStep={state.currentStep}
        totalSteps={TOTAL_STEPS}
        progress={progress}
      />

      {/* Step Content */}
      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Error Alert (shown inline for steps 2-4) */}
        {error && state.currentStep > 1 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <AlertDescription className="text-red-900">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Step 1: Role Selection */}
        {state.currentStep === 1 && (
          <Step1Role onSelect={handleRoleSelect} />
        )}

        {/* Step 2: Headline Generator */}
        {state.currentStep === 2 && (
          <Step2Headline
            role={state.selectedRole}
            currentValue={state.formData.headline}
            onChange={handleHeadlineChange}
            onNext={handleHeadlineNext}
            onBack={() => handleBack(1)}
          />
        )}

        {/* Step 3: Summary Generator */}
        {state.currentStep === 3 && (
          <Step3Summary
            role={state.selectedRole}
            currentValue={state.formData.summary}
            onChange={handleSummaryChange}
            onNext={handleSummaryNext}
            onBack={() => handleBack(2)}
          />
        )}

        {/* Step 4: Experience Descriptions */}
        {state.currentStep === 4 && (
          <Step4Experience
            experience={state.resumeData?.experience || []}
            onSave={handleComplete}
            onBack={() => handleBack(3)}
          />
        )}
      </main>
    </div>
  )
}
