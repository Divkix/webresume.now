/**
 * IP-based rate limiting for anonymous endpoints
 *
 * Uses Supabase for persistence since Cloudflare KV is not configured.
 * Hashes IPs for privacy (GDPR-friendly, no raw IPs stored).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { featureFlags } from "./config";

const HOURLY_LIMIT = 10;
const DAILY_LIMIT = 50;

interface IPRateLimitResult {
  allowed: boolean;
  remaining: {
    hourly: number;
    daily: number;
  };
  message?: string;
}

/**
 * Hash IP address for privacy-preserving storage
 * Uses SHA-256 which is sufficient for rate limiting (equality checks only)
 */
async function hashIP(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Extract client IP from request (Cloudflare Workers)
 * CF-Connecting-IP is set by Cloudflare and cannot be spoofed by clients
 */
export function getClientIP(request: Request): string {
  // CF-Connecting-IP is authoritative on Cloudflare Workers
  const cfIP = request.headers.get("cf-connecting-ip");
  if (cfIP) return cfIP;

  // Fallback for local development
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  // Final fallback
  return "unknown";
}

/**
 * Check and record IP-based rate limit for presigned URL generation
 * Returns allowed: false if limit exceeded
 *
 * Rate limits:
 * - 10 requests per IP per hour
 * - 50 requests per IP per 24 hours
 */
export async function checkIPRateLimit(ip: string): Promise<IPRateLimitResult> {
  // Skip in development
  if (!featureFlags.rateLimiting) {
    return {
      allowed: true,
      remaining: { hourly: HOURLY_LIMIT, daily: DAILY_LIMIT },
    };
  }

  const ipHash = await hashIP(ip);
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Use admin client to bypass RLS (rate limit table is service-role only)
  // Cast to any since upload_rate_limits table types haven't been generated yet
  // After running migration, regenerate types with: bun run db:types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  try {
    // Count requests in both windows in parallel
    const [hourlyResult, dailyResult] = await Promise.all([
      supabase
        .from("upload_rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneHourAgo),
      supabase
        .from("upload_rate_limits")
        .select("*", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_at", oneDayAgo),
    ]);

    if (hourlyResult.error) throw hourlyResult.error;
    if (dailyResult.error) throw dailyResult.error;

    const hourlyCount = hourlyResult.count || 0;
    const dailyCount = dailyResult.count || 0;

    const hourlyRemaining = Math.max(0, HOURLY_LIMIT - hourlyCount);
    const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyCount);

    // Check hourly limit
    if (hourlyCount >= HOURLY_LIMIT) {
      return {
        allowed: false,
        remaining: { hourly: 0, daily: dailyRemaining },
        message: `Too many upload requests. Try again in an hour. (Limit: ${HOURLY_LIMIT}/hour)`,
      };
    }

    // Check daily limit
    if (dailyCount >= DAILY_LIMIT) {
      return {
        allowed: false,
        remaining: { hourly: hourlyRemaining, daily: 0 },
        message: `Daily upload limit reached. Try again tomorrow. (Limit: ${DAILY_LIMIT}/day)`,
      };
    }

    // Record this request (insert before returning success)
    const { error: insertError } = await supabase
      .from("upload_rate_limits")
      .insert({ ip_hash: ipHash });

    if (insertError) {
      console.error("Failed to record rate limit:", insertError);
      // Continue anyway - fail open for legitimate users
      // The claim endpoint has authenticated rate limiting as a second layer
    }

    return {
      allowed: true,
      remaining: {
        hourly: hourlyRemaining - 1,
        daily: dailyRemaining - 1,
      },
    };
  } catch (error) {
    console.error("Rate limit check failed:", error);

    // SECURITY: Fail OPEN for IP rate limiting on anonymous endpoint
    // Rationale: False negatives (blocking legitimate users) are worse than
    // false positives (allowing some abuse) for anonymous onboarding.
    // The claim endpoint has authenticated rate limiting as a second layer.
    return {
      allowed: true,
      remaining: { hourly: 1, daily: 1 },
    };
  }
}
