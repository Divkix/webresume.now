import { z } from 'zod'

/**
 * Privacy settings schema
 * Controls what information is visible on the public resume page
 */
export const privacySettingsSchema = z.object({
  show_phone: z.boolean({
    message: 'Phone visibility setting must be a boolean',
  }),
  show_address: z.boolean({
    message: 'Address visibility setting must be a boolean',
  }),
})

/**
 * Handle validation schema
 * Enforces uniqueness, format, and length constraints
 */
export const handleSchema = z
  .string()
  .min(3, 'Handle must be at least 3 characters')
  .max(30, 'Handle must not exceed 30 characters')
  .regex(
    /^[a-z0-9-]+$/,
    'Handle can only contain lowercase letters, numbers, and hyphens'
  )
  .regex(/^[a-z0-9]/, 'Handle must start with a letter or number')
  .regex(/[a-z0-9]$/, 'Handle must end with a letter or number')
  .regex(/^(?!.*--)/, 'Handle cannot contain consecutive hyphens')

/**
 * Handle update request schema
 */
export const handleUpdateSchema = z.object({
  handle: handleSchema,
})

/**
 * Profile update schema
 * Optional fields for partial updates
 */
export const profileUpdateSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  avatar_url: z.string().url('Invalid URL').nullable().optional(),
  headline: z.string().max(100, 'Headline must not exceed 100 characters').nullable().optional(),
})

// Type exports for TypeScript inference
export type PrivacySettings = z.infer<typeof privacySettingsSchema>
export type HandleUpdate = z.infer<typeof handleUpdateSchema>
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
