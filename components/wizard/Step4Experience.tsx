'use client'

import { useState } from 'react'
import { Info, CheckCircle, Save, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ExperienceEntry {
  title: string
  company: string
  start_date: string
  end_date?: string
  description?: string
  highlights?: string[]
}

interface Props {
  experience: ExperienceEntry[]
  onSave: (updates: Array<{ index: number; description: string }>) => Promise<void>
  onBack: () => void
}

const MAX_CHARS = 2000

export default function Step4Experience({ experience, onSave, onBack }: Props) {
  const [descriptions, setDescriptions] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Find entries with missing descriptions and track their original indices
  const entriesWithMissingDescriptions = experience
    .map((exp, index) => ({ ...exp, originalIndex: index }))
    .filter((exp) => !exp.description || exp.description.trim() === '')

  const hasAllDescriptions = entriesWithMissingDescriptions.length === 0

  const handleDescriptionChange = (originalIndex: number, value: string) => {
    if (value.length <= MAX_CHARS) {
      setDescriptions((prev) => ({
        ...prev,
        [originalIndex]: value,
      }))
      setError(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)

    try {
      const updates = Object.entries(descriptions)
        .map(([index, description]) => ({
          index: parseInt(index),
          description: description.trim(),
        }))
        .filter((update) => update.description.length > 0)

      await onSave(updates)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save descriptions')
    } finally {
      setSaving(false)
    }
  }

  const formatDateRange = (startDate: string, endDate?: string): string => {
    const formatDate = (dateStr: string) => {
      try {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      } catch {
        return dateStr
      }
    }

    const start = formatDate(startDate)
    const end = endDate ? formatDate(endDate) : 'Present'
    return `${start} – ${end}`
  }

  const getPlaceholder = (hasHighlights: boolean): string => {
    return hasHighlights
      ? 'Summarize your role and responsibilities in 2-3 sentences...'
      : 'Describe what you did in this role...'
  }

  const getCharacterCount = (originalIndex: number): number => {
    return descriptions[originalIndex]?.length || 0
  }

  const isCharLimitExceeded = (originalIndex: number): boolean => {
    return getCharacterCount(originalIndex) > MAX_CHARS
  }

  if (hasAllDescriptions) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Add Missing Job Descriptions
          </h2>
          <p className="text-slate-600">
            All your experience entries have descriptions. You&apos;re all set!
          </p>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <Info className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            All your experience entries have descriptions. You&apos;re all set!
          </AlertDescription>
        </Alert>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 transition-all duration-300 hover:shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={() => handleSave()}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Add Missing Job Descriptions
        </h2>
        <p className="text-slate-600">
          We found {entriesWithMissingDescriptions.length} position
          {entriesWithMissingDescriptions.length !== 1 ? 's' : ''} without descriptions. Add them
          now to make your resume complete.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Experience Entries */}
      <div className="space-y-6">
        {entriesWithMissingDescriptions.map((exp) => {
          const charCount = getCharacterCount(exp.originalIndex)
          const isOverLimit = isCharLimitExceeded(exp.originalIndex)

          return (
            <div
              key={exp.originalIndex}
              className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md"
            >
              {/* Job Header */}
              <div className="mb-4">
                <h3 className="text-xl font-bold text-slate-900 mb-1">{exp.title}</h3>
                <p className="text-slate-600 font-medium">{exp.company}</p>
                <p className="text-sm text-slate-500 mt-1">
                  {formatDateRange(exp.start_date, exp.end_date)}
                </p>
              </div>

              {/* Highlights Reference (if available) */}
              {exp.highlights && exp.highlights.length > 0 && (
                <Alert className="mb-4 bg-blue-50 border-blue-200">
                  <Info className="w-4 h-4 text-blue-600" />
                  <AlertDescription>
                    <p className="text-sm font-semibold mb-2 text-blue-900">
                      Your achievements from resume:
                    </p>
                    <ul className="text-xs space-y-1 text-blue-800">
                      {exp.highlights.slice(0, 3).map((highlight, i) => (
                        <li key={i}>• {highlight}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Description Textarea */}
              <div className="space-y-2">
                <label
                  htmlFor={`description-${exp.originalIndex}`}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Description
                </label>
                <Textarea
                  id={`description-${exp.originalIndex}`}
                  value={descriptions[exp.originalIndex] || ''}
                  onChange={(e) => handleDescriptionChange(exp.originalIndex, e.target.value)}
                  placeholder={getPlaceholder(!!exp.highlights && exp.highlights.length > 0)}
                  rows={4}
                  className="resize-none transition-all duration-300 focus:shadow-sm"
                  aria-describedby={`char-count-${exp.originalIndex}`}
                  aria-invalid={isOverLimit}
                />

                {/* Character Counter */}
                <div
                  id={`char-count-${exp.originalIndex}`}
                  className="flex justify-between items-center text-xs"
                >
                  <span className="text-slate-500 font-medium">Optional field</span>
                  <span
                    className={`font-medium transition-colors duration-200 ${
                      isOverLimit ? 'text-red-600' : 'text-slate-500'
                    }`}
                  >
                    {charCount} / {MAX_CHARS}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={saving}
          className="flex-1 transition-all duration-300 hover:shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || Object.values(descriptions).some((desc) => desc.length > MAX_CHARS)}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save & Continue
            </>
          )}
        </Button>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-slate-500 text-center">
        You can skip entries and add descriptions later from your dashboard
      </p>
    </div>
  )
}
