'use client'

import { useState } from 'react'
import { ROLE_TEMPLATES, type RoleId } from '@/lib/onboarding/role-templates'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react'

interface Step2HeadlineProps {
  role: string | null
  currentValue?: string
  onChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Step 2: Headline Generator Component
 * Provides role-based headline suggestions with manual input option
 */
export function Step2Headline({
  role,
  currentValue = '',
  onChange,
  onNext,
  onBack,
}: Step2HeadlineProps) {
  const [value, setValue] = useState(currentValue)
  const MAX_LENGTH = 100

  // Get template suggestion based on selected role
  const template = role && role in ROLE_TEMPLATES
    ? ROLE_TEMPLATES[role as RoleId]
    : null

  const handleSuggestionClick = () => {
    if (template?.headlineTemplate) {
      setValue(template.headlineTemplate)
      onChange(template.headlineTemplate)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const isValid = value.trim().length > 0 && value.length <= MAX_LENGTH
  const remainingChars = MAX_LENGTH - value.length

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 leading-tight">
          Create Your Professional Headline
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Your headline is the first thing recruiters see. Make it count with a clear, compelling statement.
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
              Click the suggestion below to auto-fill, or write your own from scratch.
            </p>
            <Badge
              onClick={handleSuggestionClick}
              className="cursor-pointer bg-white hover:bg-indigo-100 text-indigo-900 border-indigo-300 hover:border-indigo-400 transition-all duration-300 px-3 py-1.5 text-sm font-medium"
              variant="outline"
            >
              {template.headlineTemplate}
            </Badge>
          </div>
        )}

        {/* Input Field */}
        <div className="space-y-2">
          <label htmlFor="headline" className="block text-sm font-semibold text-slate-700">
            Your Professional Headline
          </label>
          <Input
            id="headline"
            type="text"
            value={value}
            onChange={handleChange}
            placeholder="e.g., Full-Stack Developer | React & Node.js Specialist"
            className="text-lg py-6 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20"
            maxLength={MAX_LENGTH}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Keep it concise and impactful
            </p>
            <p
              className={`text-xs font-medium ${
                remainingChars < 20
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            >
              {remainingChars} characters remaining
            </p>
          </div>
        </div>

        {/* Example Tips */}
        {!template && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">
              Pro Tips:
            </h4>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Include your role and key specialization</li>
              <li>Use industry-recognized terms</li>
              <li>Avoid generic phrases like &quot;hard worker&quot;</li>
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
          Step 2 of 6 — You can edit this later in your dashboard
        </p>
      </div>
    </div>
  )
}
