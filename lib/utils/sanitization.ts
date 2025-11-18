/**
 * Input sanitization utilities for security and XSS prevention
 * Designed to work in Cloudflare Workers environment (no DOM available)
 */

/**
 * Sanitizes plain text by removing/encoding dangerous HTML characters
 * Prevents XSS attacks by encoding special characters
 */
export function sanitizeText(input: string): string {
  if (!input) return ''

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitizes and validates URLs
 * Only allows http://, https://, and mailto: protocols
 * Blocks javascript:, data:, and other dangerous protocols
 */
export function sanitizeUrl(input: string): string {
  if (!input) return ''

  // Trim and lowercase the protocol check
  const trimmed = input.trim()
  const lower = trimmed.toLowerCase()

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
    'about:',
  ]

  for (const protocol of dangerousProtocols) {
    if (lower.startsWith(protocol)) {
      return ''
    }
  }

  // Allow only safe protocols
  const safeProtocols = ['http://', 'https://', 'mailto:']
  const hasProtocol = safeProtocols.some((protocol) =>
    lower.startsWith(protocol)
  )

  if (!hasProtocol) {
    // If no protocol, assume https://
    return `https://${trimmed}`
  }

  return trimmed
}

/**
 * Validates and sanitizes email addresses
 * Basic format check and special character encoding
 */
export function sanitizeEmail(input: string): string {
  if (!input) return ''

  const trimmed = input.trim().toLowerCase()

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) {
    return ''
  }

  // Remove any dangerous characters
  return trimmed.replace(/[<>'"]/g, '')
}

/**
 * Sanitizes HTML content while preserving basic formatting
 * Removes dangerous tags and attributes
 * Use sparingly - prefer sanitizeText for most use cases
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''

  // Remove script tags and their content
  let cleaned = input.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  )

  // Remove iframe tags
  cleaned = cleaned.replace(
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    ''
  )

  // Remove dangerous event handlers
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
  cleaned = cleaned.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove style tags (can contain javascript)
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ''
  )

  // Remove object and embed tags
  cleaned = cleaned.replace(/<object\b[^>]*>.*?<\/object>/gi, '')
  cleaned = cleaned.replace(/<embed\b[^>]*>/gi, '')

  // Remove dangerous attributes
  cleaned = cleaned.replace(/\s*javascript:/gi, '')
  cleaned = cleaned.replace(/\s*data:/gi, '')

  return cleaned
}

/**
 * Validates and sanitizes phone numbers
 * Allows only digits, spaces, hyphens, parentheses, and plus sign
 */
export function sanitizePhone(input: string): string {
  if (!input) return ''

  // Allow only valid phone number characters
  return input.replace(/[^0-9\s\-()+ ]/g, '').trim()
}

/**
 * Sanitizes markdown-like content
 * Removes dangerous HTML while preserving basic markdown
 */
export function sanitizeMarkdown(input: string): string {
  if (!input) return ''

  // First sanitize HTML
  let cleaned = sanitizeHtml(input)

  // Remove any remaining HTML tags except basic formatting
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'code', 'pre']
  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi

  cleaned = cleaned.replace(tagRegex, (match, tagName) => {
    if (allowedTags.includes(tagName.toLowerCase())) {
      return match
    }
    return ''
  })

  return cleaned
}

/**
 * Checks if a string contains potential XSS patterns
 * Returns true if suspicious content is detected
 */
export function containsXssPattern(input: string): boolean {
  if (!input) return false

  // Check for script tags
  if (/<script/i.test(input)) return true

  // Check for javascript: protocol
  if (/javascript:/i.test(input)) return true

  // Check for event handlers
  if (/\s*on\w+\s*=/i.test(input)) return true

  // Check for data: protocol (can be used for XSS)
  if (/data:text\/html/i.test(input)) return true

  // Check for iframe tags
  if (/<iframe/i.test(input)) return true

  return false
}

/**
 * Truncates text to a maximum length while preserving word boundaries
 */
export function truncateText(
  text: string,
  maxLength: number,
  ellipsis = '...'
): string {
  if (!text || text.length <= maxLength) return text

  const truncated = text.slice(0, maxLength - ellipsis.length)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + ellipsis
  }

  return truncated + ellipsis
}

/**
 * Removes null bytes and control characters that could cause issues
 */
export function removeControlCharacters(input: string): string {
  if (!input) return ''

  // Remove null bytes and other control characters except newlines and tabs
  return input.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Comprehensive sanitization for user-generated content
 * Applies multiple sanitization steps for maximum security
 */
export function sanitizeUserContent(input: string): string {
  if (!input) return ''

  let sanitized = input.trim()
  sanitized = removeControlCharacters(sanitized)
  sanitized = sanitizeHtml(sanitized)

  // Final check for XSS patterns
  if (containsXssPattern(sanitized)) {
    console.warn('XSS pattern detected in user content, returning empty string')
    return ''
  }

  return sanitized
}
