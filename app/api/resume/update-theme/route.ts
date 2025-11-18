import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_THEMES = ['bento', 'glass', 'minimalist_editorial', 'neo_brutalist'] as const
type ValidTheme = (typeof VALID_THEMES)[number]

function isValidTheme(theme: string): theme is ValidTheme {
  return VALID_THEMES.includes(theme as ValidTheme)
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { theme_id } = body

    // Validate theme_id
    if (!theme_id || typeof theme_id !== 'string') {
      return NextResponse.json({ error: 'theme_id is required' }, { status: 400 })
    }

    if (!isValidTheme(theme_id)) {
      return NextResponse.json(
        {
          error: 'Invalid theme_id',
          valid_themes: VALID_THEMES,
        },
        { status: 400 }
      )
    }

    // Update site_data theme_id
    const { error: updateError } = await supabase
      .from('site_data')
      .update({
        theme_id,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update theme:', updateError)
      return NextResponse.json({ error: 'Failed to update theme' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      theme_id,
      message: 'Theme updated successfully',
    })
  } catch (error) {
    console.error('Theme update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
