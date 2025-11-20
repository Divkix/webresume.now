import { createClient } from '@/lib/supabase/server'
import {
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from '@/lib/utils/security-headers'
import { validateRequestSize } from '@/lib/utils/validation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sanitizeText, containsXssPattern } from '@/lib/utils/sanitization'
import type { ResumeContent, Json } from '@/lib/types/database'

/**
 * Wizard completion request schema
 * Validates the structure of experience updates and user inputs
 */
const experienceUpdateSchema = z.object({
  index: z.number().int().min(0).max(9),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(5000, 'Description is too long (max 5000 characters)')
    .refine(
      (val) => !containsXssPattern(val),
      { message: 'Invalid content detected' }
    ),
})

const wizardCompleteSchema = z.object({
  role: z.enum([
    'student',
    'recent_graduate',
    'junior_professional',
    'mid_level_professional',
    'senior_professional',
    'freelancer',
  ]),
  headline: z
    .string()
    .trim()
    .min(1, 'Headline is required')
    .max(200, 'Headline is too long')
    .refine(
      (val) => !containsXssPattern(val),
      { message: 'Invalid content detected' }
    )
    .transform(sanitizeText),
  summary: z
    .string()
    .trim()
    .min(1, 'Summary is required')
    .max(10000, 'Summary is too long (max 10000 characters)')
    .refine(
      (val) => !containsXssPattern(val),
      { message: 'Invalid content detected' }
    )
    .transform(sanitizeText),
  experience_updates: z
    .array(experienceUpdateSchema)
    .max(10, 'Maximum 10 experience updates allowed')
    .optional(),
})

type WizardCompleteRequest = z.infer<typeof wizardCompleteSchema>

/**
 * POST /api/wizard/complete
 * Completes the onboarding wizard by updating user profile and site content
 *
 * Request body:
 * {
 *   role: 'student' | 'recent_graduate' | 'junior_professional' | 'mid_level_professional' | 'senior_professional' | 'freelancer',
 *   headline: string,
 *   summary: string,
 *   experience_updates: [{ index: number, description: string }]
 * }
 *
 * Response:
 * {
 *   success: true
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Validate request size before parsing (prevent DoS)
    const sizeCheck = validateRequestSize(request)
    if (!sizeCheck.valid) {
      return createErrorResponse(
        sizeCheck.error || 'Request body too large',
        ERROR_CODES.BAD_REQUEST,
        413
      )
    }

    const supabase = await createClient()

    // 2. Authenticate user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return createErrorResponse(
        'You must be logged in to complete onboarding',
        ERROR_CODES.UNAUTHORIZED,
        401
      )
    }

    // 3. Parse and validate request body
    let body: WizardCompleteRequest
    try {
      const rawBody = await request.json()
      const validation = wizardCompleteSchema.safeParse(rawBody)

      if (!validation.success) {
        return createErrorResponse(
          'Validation failed. Please check your input.',
          ERROR_CODES.VALIDATION_ERROR,
          400,
          validation.error.issues
        )
      }

      body = validation.data
    } catch {
      return createErrorResponse(
        'Invalid JSON in request body',
        ERROR_CODES.BAD_REQUEST,
        400
      )
    }

    // 4. Update profiles table with role and mark onboarding as completed
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        role: body.role,
        onboarding_completed: true,
        headline: body.headline,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Profile update error:', profileError)
      return createErrorResponse(
        'Failed to update profile. Please try again.',
        ERROR_CODES.DATABASE_ERROR,
        500
      )
    }

    // 5. Fetch current site_data for the user
    const { data: siteData, error: fetchError } = await supabase
      .from('site_data')
      .select('id, content')
      .eq('user_id', user.id)
      .single()

    if (fetchError || !siteData) {
      console.error('Site data fetch error:', fetchError)
      return createErrorResponse(
        'Failed to fetch site data. Please try again.',
        ERROR_CODES.NOT_FOUND,
        404
      )
    }

    // 6. Update content JSON with new headline, summary, and experience descriptions
    const currentContent = siteData.content as unknown as ResumeContent
    const updatedContent: ResumeContent = {
      ...currentContent,
      headline: body.headline,
      summary: body.summary,
    }

    // Apply experience updates if provided
    if (body.experience_updates && body.experience_updates.length > 0) {
      const experience = [...(updatedContent.experience || [])]

      for (const update of body.experience_updates) {
        if (update.index >= 0 && update.index < experience.length) {
          experience[update.index] = {
            ...experience[update.index],
            description: update.description,
          }
        }
      }

      updatedContent.experience = experience
    }

    // 7. Save updated content back to site_data and update last_published_at
    const { error: updateError } = await supabase
      .from('site_data')
      .update({
        content: updatedContent as unknown as Json,
        last_published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', siteData.id)

    if (updateError) {
      console.error('Site data update error:', updateError)
      return createErrorResponse(
        'Failed to update site content. Please try again.',
        ERROR_CODES.DATABASE_ERROR,
        500
      )
    }

    // 8. Revalidate public page cache if handle exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', user.id)
      .single()

    if (profile?.handle) {
      // Revalidate the public resume page immediately
      // Next visitor will see updated content
      revalidatePath(`/${profile.handle}`)
    }

    // 9. Return success response
    return createSuccessResponse({
      success: true,
    })
  } catch (error) {
    console.error('Unexpected error in wizard completion:', error)
    return createErrorResponse(
      'An unexpected error occurred. Please try again.',
      ERROR_CODES.INTERNAL_ERROR,
      500
    )
  }
}
