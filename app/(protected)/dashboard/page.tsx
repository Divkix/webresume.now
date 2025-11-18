import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Edit3,
  Shield,
  Upload,
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  Wrench,
  InfoIcon
} from 'lucide-react'
import { CopyLinkButton } from '@/components/dashboard/CopyLinkButton'
import type { ResumeContent } from '@/lib/types/database'

/**
 * Calculate profile completeness score based on available data
 */
function calculateCompleteness(content: ResumeContent): number {
  let score = 0
  let total = 0

  // Full name (required) - 10%
  total += 10
  if (content.full_name?.trim()) score += 10

  // Headline (required) - 10%
  total += 10
  if (content.headline?.trim()) score += 10

  // Summary (required) - 15%
  total += 15
  if (content.summary?.trim()) score += 15

  // Contact (required) - 10%
  total += 10
  if (content.contact?.email) score += 10

  // Experience (required) - 20%
  total += 20
  if (content.experience?.length > 0) score += 20

  // Education - 15%
  total += 15
  if (content.education && content.education.length > 0) score += 15

  // Skills - 10%
  total += 10
  if (content.skills && content.skills.length > 0) score += 10

  // Certifications - 10%
  total += 10
  if (content.certifications && content.certifications.length > 0) score += 10

  return Math.round((score / total) * 100)
}

/**
 * Get suggestions for improving profile
 */
function getProfileSuggestions(content: ResumeContent): string[] {
  const suggestions: string[] = []

  if (!content.education || content.education.length === 0) {
    suggestions.push('Add your education background')
  }

  if (!content.skills || content.skills.length === 0) {
    suggestions.push('List your technical skills')
  }

  if (!content.certifications || content.certifications.length === 0) {
    suggestions.push('Add certifications to stand out')
  }

  if (content.experience.length < 2) {
    suggestions.push('Add more work experience entries')
  }

  if (!content.contact.linkedin && !content.contact.github) {
    suggestions.push('Link your professional social profiles')
  }

  return suggestions
}

/**
 * Format relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Fetch most recent resume
  const { data: resume } = await supabase
    .from('resumes')
    .select('id, status, error_message, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Fetch site data if available
  const { data: siteData } = await supabase
    .from('site_data')
    .select('id, content, last_published_at, created_at')
    .eq('user_id', user.id)
    .single()

  // Determine resume state
  const hasResume = !!resume
  const hasPublishedSite = !!siteData
  const content = siteData?.content as ResumeContent | null

  // Calculate profile metrics
  const completeness = content ? calculateCompleteness(content) : 0
  const suggestions = content ? getProfileSuggestions(content) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            {content?.full_name && (
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {content.full_name.split(' ')[0]}!
              </p>
            )}
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Empty State - No Resume */}
        {!hasResume && (
          <Alert className="border-blue-200 bg-blue-50">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <div className="space-y-3">
                <p className="font-medium">Get started in 3 easy steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Upload your resume PDF</li>
                  <li>AI analyzes and extracts your information</li>
                  <li>Review, customize, and publish your web resume</li>
                </ol>
                <Button asChild className="mt-2">
                  <Link href="/">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Your First Resume
                  </Link>
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Resume Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Resume Status</CardTitle>
            <CardDescription>Current state of your resume processing</CardDescription>
          </CardHeader>
          <CardContent>
            {!hasResume && (
              <div className="text-center py-8 space-y-4">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
                <div className="space-y-2">
                  <p className="text-gray-600">No resume uploaded yet</p>
                  <p className="text-sm text-gray-500">
                    Upload your resume PDF to get started
                  </p>
                </div>
              </div>
            )}

            {hasResume && resume.status === 'processing' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Your resume is being analyzed...</p>
                    <p className="text-sm text-gray-500">
                      This usually takes 30-40 seconds
                    </p>
                  </div>
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    Processing
                  </Badge>
                </div>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/waiting?resume_id=${resume.id}`}>
                    View Progress
                  </Link>
                </Button>
              </div>
            )}

            {hasResume && resume.status === 'failed' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900">Processing failed</p>
                    <p className="text-sm text-red-700">
                      {resume.error_message || 'Unknown error occurred'}
                    </p>
                  </div>
                  <Badge variant="destructive">Failed</Badge>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button asChild variant="default" className="flex-1">
                    <Link href={`/waiting?resume_id=${resume.id}`}>
                      Try Again
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New Resume
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {hasResume && resume.status === 'completed' && hasPublishedSite && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-green-900">Resume published!</p>
                    <p className="text-sm text-gray-500">
                      Your web resume is live and ready to share
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Published
                  </Badge>
                </div>
                {profile?.handle && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button asChild className="flex-1">
                      <Link href={`/${profile.handle}`}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Your Resume
                      </Link>
                    </Button>
                    <CopyLinkButton handle={profile.handle} />
                  </div>
                )}
              </div>
            )}

            {hasResume && resume.status === 'pending_claim' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">Claiming your resume...</p>
                    <p className="text-sm text-gray-500">Please wait</p>
                  </div>
                  <Badge variant="default" className="bg-gray-100 text-gray-800">
                    Pending
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Content Preview Card */}
        {hasPublishedSite && content && (
          <Card>
            <CardHeader>
              <CardTitle>Resume Preview</CardTitle>
              <CardDescription>Quick overview of your published content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name and Headline */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {content.full_name}
                </h2>
                <p className="text-base text-gray-600 mt-1">
                  {content.headline}
                </p>
              </div>

              <Separator />

              {/* Summary */}
              {content.summary && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
                  <p className="text-sm text-gray-600">
                    {truncateText(content.summary, 200)}
                    {content.summary.length > 200 && (
                      <Button
                        asChild
                        variant="link"
                        className="h-auto p-0 ml-1 text-blue-600"
                      >
                        <Link href="/edit">Read more</Link>
                      </Button>
                    )}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {content.experience?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      Position{content.experience?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {content.education?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Education</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {content.skills?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">
                      Skill{content.skills?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {content.certifications?.length || 0}
                    </p>
                    <p className="text-xs text-gray-600">Certs</p>
                  </div>
                </div>
              </div>

              {/* Last Updated */}
              {siteData.last_published_at && (
                <div className="pt-2">
                  <p className="text-xs text-gray-500">
                    Last updated {formatRelativeTime(siteData.last_published_at)}
                  </p>
                </div>
              )}

              <Separator />

              <Button asChild className="w-full">
                <Link href="/edit">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Content
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Profile Completeness */}
        {hasPublishedSite && content && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Completeness</CardTitle>
              <CardDescription>
                {completeness}% complete
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    completeness >= 90
                      ? 'bg-green-600'
                      : completeness >= 70
                      ? 'bg-blue-600'
                      : 'bg-yellow-600'
                  }`}
                  style={{ width: `${completeness}%` }}
                />
              </div>

              {suggestions.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Suggestions to improve:
                  </p>
                  <ul className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {completeness === 100 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    Your profile is complete! Great job.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        {hasPublishedSite && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Manage your web resume</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/edit" className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    <span className="font-medium">Edit Resume Content</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Update your information and experience
                  </span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/settings" className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Privacy Settings</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Control what information is visible
                  </span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/" className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="font-medium">Upload New Resume</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Replace with an updated PDF
                  </span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="justify-start h-auto py-4">
                <Link href="/settings" className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">Account Settings</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Manage your handle and preferences
                  </span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <span className="text-sm text-gray-600">{user.email}</span>
            </div>

            {profile?.handle && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Handle</span>
                  <Link
                    href={`/${profile.handle}`}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    webresume.now/{profile.handle}
                  </Link>
                </div>
              </>
            )}

            {profile?.created_at && (
              <>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Member since</span>
                  <span className="text-sm text-gray-600">
                    {formatRelativeTime(profile.created_at)}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
