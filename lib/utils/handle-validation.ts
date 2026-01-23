import { handleSchema } from "@/lib/schemas/profile";

/**
 * Handle validation utilities for the [handle] catch-all route.
 *
 * WHY THIS EXISTS:
 * The [handle] dynamic route catches ALL unmatched paths, including:
 * - Bot probes: /wp-admin, /phpmyadmin, /.env
 * - Missing files: /robots.txt, /sitemap.xml, /ads.txt
 * - Malformed requests: /CAPS, /spaces here, /a
 *
 * Without validation, each garbage request triggers a D1 database query
 * before returning 404. This utility rejects obviously invalid handles
 * BEFORE any database call, saving unnecessary reads.
 *
 * Note: Common favicon files (apple-touch-icon.png, favicon.ico, etc.)
 * are served from public/ and never hit this route.
 */

/**
 * Reserved handles that cannot be used as user handles
 * These match route groups and common system paths
 *
 * Also used by: app/api/handle/check/route.ts
 */
export const RESERVED_HANDLES = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "edit",
  "login",
  "logout",
  "settings",
  "wizard",
  "waiting",
  "onboarding",
  "profile",
  "resume",
  "help",
  "support",
  "about",
  "terms",
  "privacy",
  "contact",
  "themes",
  "_next",
  "static",
  "public",
]);

/**
 * Check if a handle has a valid format for routing
 * Used to early-reject clearly invalid handles before database queries
 *
 * @param handle - The handle to validate
 * @returns true if the handle could potentially be valid, false otherwise
 */
export function isValidHandleFormat(handle: string): boolean {
  // Quick reject: file paths (contain dots)
  if (handle.includes(".")) return false;

  // Quick reject: reserved routes
  if (RESERVED_HANDLES.has(handle.toLowerCase())) return false;

  // Full schema validation (length, character set, format)
  return handleSchema.safeParse(handle).success;
}
