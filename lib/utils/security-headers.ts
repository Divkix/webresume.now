/**
 * Security headers for API responses
 * Provides defense-in-depth against common web vulnerabilities
 */

/**
 * Standard security headers for all API responses
 */
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires these
    "style-src 'self' 'unsafe-inline'", // Tailwind requires inline styles
    "img-src 'self' https: data:", // Allow external images and data URIs for avatars
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://api.replicate.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; '),
} as const

/**
 * Validates CSRF protection via Sec-Fetch-Site header
 * Returns null if valid, or a Response if invalid
 */
export function validateCsrf(request: Request): Response | null {
  // Skip CSRF check for webhooks (they use signature verification)
  const url = new URL(request.url)
  if (url.pathname.includes('/webhook/')) {
    return null
  }

  const secFetchSite = request.headers.get('sec-fetch-site')

  // Allow same-origin and same-site requests
  // Also allow 'none' for direct navigation (though POST shouldn't happen this way)
  const allowedValues = ['same-origin', 'same-site', 'none']

  if (secFetchSite && !allowedValues.includes(secFetchSite)) {
    return new Response(
      JSON.stringify({ error: 'CSRF validation failed', code: 'CSRF_ERROR' }),
      { status: 403, headers: { 'Content-Type': 'application/json', ...SECURITY_HEADERS } }
    )
  }

  return null
}

/**
 * Creates a standardized error response with security headers
 */
export function createErrorResponse(
  error: string,
  code: string,
  status: number,
  details?: unknown
): Response {
  return new Response(
    JSON.stringify({
      error,
      code,
      details,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...SECURITY_HEADERS,
      },
    }
  )
}

/**
 * Creates a standardized success response with security headers
 */
export function createSuccessResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...SECURITY_HEADERS,
    },
  })
}

/**
 * Error codes for consistent error handling
 */
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  BAD_REQUEST: 'BAD_REQUEST',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  CSRF_ERROR: 'CSRF_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
