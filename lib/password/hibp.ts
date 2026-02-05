/**
 * Have I Been Pwned (HIBP) breach checking using k-Anonymity
 *
 * Checks if a password has been exposed in known data breaches using
 * the HIBP Pwned Passwords API with k-Anonymity to protect the password.
 *
 * Only the first 5 characters of the SHA-1 hash are sent to the API,
 * preventing exposure of the actual password.
 *
 * @see https://haveibeenpwned.com/API/v3#PwnedPasswords
 */

/**
 * Result of HIBP breach check
 */
export interface BreachResult {
  /** Whether the password was found in breach databases */
  isBreached: boolean;
  /** Number of times the password appeared in breaches */
  count: number;
  /** Error message if the check failed */
  error?: string;
}

/**
 * Convert string to SHA-1 hash using Web Crypto API
 * Works in both browser and Cloudflare Workers
 */
async function sha1(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/**
 * Check if a password has been exposed in known data breaches
 *
 * Uses HIBP's k-Anonymity model - only the first 5 characters of the
 * SHA-1 hash are sent, protecting the actual password.
 *
 * **Fails open** - on network errors, returns `isBreached: false` to
 * avoid blocking user registration due to temporary API issues.
 *
 * @param password - The password to check
 * @returns Breach result with count if found
 *
 * @example
 * ```ts
 * const result = await checkBreached("password123");
 *
 * if (result.isBreached) {
 *   console.warn(`Password found in ${result.count} breaches!`);
 * }
 *
 * // Handle network errors gracefully
 * if (result.error) {
 *   console.warn("Could not check breach status:", result.error);
 * }
 * ```
 */
export async function checkBreached(password: string): Promise<BreachResult> {
  try {
    // Get SHA-1 hash of password
    const hash = await sha1(password);

    // k-Anonymity: only send first 5 chars
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);

    // Query HIBP API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        // Add padding to obscure exact response size
        "Add-Padding": "true",
        // Identify as clickfolio.me
        "User-Agent": "clickfolio.me-password-check",
      },
    });

    if (!response.ok) {
      return {
        isBreached: false,
        count: 0,
        error: `HIBP API error: ${response.status} ${response.statusText}`,
      };
    }

    // Parse response: each line is "HASH_SUFFIX:COUNT"
    const text = await response.text();
    const lines = text.trim().split("\n");

    for (const line of lines) {
      const [lineSuffix, countStr] = line.split(":");
      if (lineSuffix?.trim().toUpperCase() === suffix) {
        return {
          isBreached: true,
          count: Number.parseInt(countStr?.trim() || "0", 10),
        };
      }
    }

    // Password not found in breaches
    return {
      isBreached: false,
      count: 0,
    };
  } catch (err) {
    // Fail open - don't block registration on network issues
    const message = err instanceof Error ? err.message : "Unknown error";
    console.warn("[HIBP] Breach check failed:", message);
    return {
      isBreached: false,
      count: 0,
      error: message,
    };
  }
}
