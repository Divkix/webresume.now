'use client'

import { useState } from 'react'
import { ROLE_TEMPLATES, type RoleId } from '@/lib/onboarding/role-templates'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, ArrowLeft, ArrowRight, AlertCircle } from 'lucide-react'

interface Step3SummaryProps {
  role: string | null
  currentValue?: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Step 3: Summary Generator Component
 * Provides role-based summary suggestions with manual input option
 */
export function Step3Summary({
  role,
  currentValue = '',
  onChange,
  onNext,
  onBack,
}: Step3SummaryProps) {
  const [value, setValue] = useState(currentValue)
  const MIN_RECOMMENDED = 50
  const MAX_LENGTH = 2000

  // Get template suggestion based on selected role
  const template = role && role in ROLE_TEMPLATES
    ? ROLE_TEMPLATES[role as RoleId]
    : null

  const handleSuggestionClick = () => {
    if (template?.summaryTemplate) {
      setValue(template.summaryTemplate)
      onChange(template.summaryTemplate)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= MAX_LENGTH) {
      setValue(newValue)
      onChange(newValue)
    }
  }

  const handleNext = () => {
    if (value.trim().length > 0) {
      onNext()
    }
  }

  const charCount = value.length
  const isValid = value.trim().length > 0
  const isBelowRecommended = charCount > 0 && charCount < MIN_RECOMMENDED
  const remainingChars = MAX_LENGTH - charCount

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
          Polish Your Professional Summary
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Summarize your expertise, key skills, and what makes you unique in 2-3 sentences.
        </p>
      </div>

      {/* Main Content Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 space-y-6">
        {/* Suggestion Box */}
        {template && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-900">
                Suggested Template
              </h3>
            </div>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Click the suggestion below to auto-fill, then customize it with your specific details.
            </p>
            <Badge
              onClick={handleSuggestionClick}
              className="cursor-pointer bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-300 hover:border-indigo-400 transition-all duration-300 px-3 py-1.5 text-sm font-medium whitespace-normal h-auto"
              variant="outline"
            >
              {template.summaryTemplate}
            </Badge>
          </div>
        )}

        {/* Textarea Field */}
        <div className="space-y-2">
          <label htmlFor="summary" className="block text-sm font-semibold text-slate-700">
            Your Professional Summary
          </label>
          <Textarea
            id="summary"
            value={value}
            onChange={handleChange}
            placeholder="e.g., Results-driven Full-Stack Developer with 5+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud architecture. Proven track record of delivering high-impact projects that drive business growth."
            className="min-h-32 text-base border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20 resize-y"
            rows={6}
            maxLength={MAX_LENGTH}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Recommended: {MIN_RECOMMENDED}-500 characters
            </p>
            <p
              className={`text-xs font-medium ${
                remainingChars < 100
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            >
              {charCount} / {MAX_LENGTH} characters
            </p>
          </div>
        </div>

        {/* Warning Alert for Short Summary */}
        {isBelowRecommended && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <AlertDescription className="text-sm text-amber-800">
              Your summary is shorter than recommended. Consider adding more details about your expertise and achievements.
            </AlertDescription>
          </Alert>
        )}

        {/* Example Tips */}
        {!template && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Pro Tips:
            </h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Start with your role and years of experience</li>
              <li>Highlight 2-3 key skills or specializations</li>
              <li>Mention notable achievements or impact</li>
              <li>Use active voice and specific metrics when possible</li>
            </ul>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={!isValid}
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-slate-500 font-medium">
          Step 3 of 6 — You can edit this later in your dashboard
        </p>
      </div>
    </div>
  )
}
