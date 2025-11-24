/**
 * Environment Configuration Validation
 *
 * Validates required environment variables and provides
 * type-safe access to configuration values.
 */

/**
 * Check if running in production environment
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development environment
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Feature flags for development/production
 */
export const featureFlags = {
  // Enable verbose logging in development
  verboseLogging: isDevelopment(),

  // Enable debug mode in development
  debugMode: isDevelopment(),

  // Enable rate limiting (production only)
  rateLimiting: isProduction(),

  // Enable error reporting (production only)
  errorReporting: isProduction(),
} as const;
