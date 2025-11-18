import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User } from 'lucide-react'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PrivacySettingsForm } from '@/components/forms/PrivacySettings'
import { HandleForm } from '@/components/forms/HandleForm'
import { isValidPrivacySettings } from '@/lib/utils/privacy'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, handle, email, avatar_url, headline, privacy_settings')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Failed to fetch profile:', error)
    redirect('/dashboard')
  }

  // Validate and normalize privacy settings
  const privacySettings = isValidPrivacySettings(profile.privacy_settings)
    ? profile.privacy_settings
    : { show_phone: false, show_address: false }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Profile Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your account details and basic information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-sm text-gray-900">{profile.email}</p>
              </div>
              {profile.handle && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">Handle</p>
                  <Link
                    href={`/${profile.handle}`}
                    className="text-sm text-blue-600 hover:underline font-mono"
                  >
                    @{profile.handle}
                  </Link>
                </div>
              )}
            </div>

            {profile.headline && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600">Headline</p>
                <p className="text-sm text-gray-900">{profile.headline}</p>
              </div>
            )}

            {profile.avatar_url && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Avatar</p>
                <img
                  src={profile.avatar_url}
                  alt="Profile avatar"
                  className="w-16 h-16 rounded-full object-cover border border-gray-200"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Handle Management */}
        {profile.handle && (
          <HandleForm currentHandle={profile.handle} />
        )}

        {/* Privacy Settings */}
        <PrivacySettingsForm
          initialSettings={privacySettings}
          userHandle={profile.handle}
        />

        {/* Danger Zone (Optional - placeholder for future features) */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-900">Danger Zone</CardTitle>
            <CardDescription className="text-red-700">
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-900">
                Account deletion and data export features coming soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
