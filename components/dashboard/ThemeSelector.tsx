'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { THEME_METADATA, type ThemeId } from '@/lib/templates/theme-registry'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ThemeSelectorProps {
  initialThemeId: string
}

export function ThemeSelector({ initialThemeId }: ThemeSelectorProps) {
  const router = useRouter()
  const [selectedTheme, setSelectedTheme] = useState<ThemeId>(
    (initialThemeId as ThemeId) || 'minimalist_editorial'
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleThemeChange(themeId: ThemeId) {
    if (themeId === selectedTheme) return

    setIsUpdating(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      const response = await fetch('/api/resume/update-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_id: themeId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update theme')
      }

      setSelectedTheme(themeId)
      setSuccessMessage(`Theme updated to ${THEME_METADATA[themeId].name}`)

      // Refresh the page to reflect changes
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error('Failed to update theme:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update theme')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose Your Template</CardTitle>
        <CardDescription>Select how your resume appears to visitors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-900 text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-sm">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Theme Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(THEME_METADATA).map(([id, meta]) => (
            <button
              key={id}
              onClick={() => handleThemeChange(id as ThemeId)}
              disabled={isUpdating}
              className={`
                p-6 rounded-xl border-2 text-left transition-all
                ${
                  selectedTheme === id
                    ? 'border-amber-600 bg-amber-50 shadow-lg'
                    : 'border-neutral-200 hover:border-neutral-300 bg-white'
                }
                ${isUpdating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{meta.name}</h3>
                  <span className="text-xs uppercase tracking-wide text-neutral-500 font-medium">
                    {meta.category}
                  </span>
                </div>
                {selectedTheme === id && (
                  <div className="flex items-center gap-1">
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    ) : (
                      <span className="text-amber-600 text-sm font-bold">Active</span>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-neutral-600">{meta.description}</p>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
