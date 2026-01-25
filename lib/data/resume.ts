import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";
import type { PrivacySettings } from "@/lib/db/schema";
import { user } from "@/lib/db/schema";
import { resumeContentSchema } from "@/lib/schemas/resume";
import type { ResumeContent } from "@/lib/types/database";
import { extractCityState, isValidPrivacySettings } from "@/lib/utils/privacy";

export interface ResumeData {
  profile: {
    id: string;
    handle: string;
    email: string;
    avatar_url: string | null;
    headline: string | null;
  };
  content: ResumeContent;
  theme_id: string | null;
}

export interface ResumeMetadata {
  full_name: string;
  headline?: string | null;
  summary?: string | null;
  avatar_url: string | null;
}

/**
 * Cache tag format for resume pages.
 * Used for on-demand revalidation via revalidateTag.
 */
export function getResumeCacheTag(handle: string): string {
  return `resume:${handle}`;
}

/**
 * Fetch resume data from D1 via Drizzle WITHOUT using cookies.
 * This is the raw fetcher that gets wrapped by unstable_cache.
 *
 * Privacy filtering is applied at cache time, so cached content
 * is already privacy-filtered.
 */
async function fetchResumeDataRaw(handle: string): Promise<ResumeData | null> {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  // Fetch user by handle with siteData relation
  const userData = await db.query.user.findFirst({
    where: eq(user.handle, handle),
    with: {
      siteData: true,
    },
  });

  if (!userData) {
    return null;
  }

  // Ensure siteData exists
  if (!userData.siteData) {
    return null;
  }

  // Parse and validate content JSON (stored as text in D1)
  let content: ResumeContent;
  try {
    const rawContent = JSON.parse(userData.siteData.content);

    // Validate with Zod schema to ensure data integrity and XSS prevention
    const parseResult = resumeContentSchema.safeParse(rawContent);
    if (!parseResult.success) {
      console.error("Invalid site_data content for handle:", handle, parseResult.error.format());
      return null;
    }

    content = parseResult.data as ResumeContent;
  } catch (error) {
    console.error("Failed to parse site_data content for handle:", handle, error);
    return null;
  }

  // Parse privacy settings from JSON string
  const parsedPrivacySettings = userData.privacySettings
    ? (JSON.parse(userData.privacySettings) as PrivacySettings)
    : null;

  // Apply privacy filtering with type guard
  const privacySettings: PrivacySettings = isValidPrivacySettings(parsedPrivacySettings)
    ? parsedPrivacySettings
    : { show_phone: false, show_address: false };

  // Remove phone if privacy setting is false
  if (!privacySettings.show_phone && content.contact?.phone) {
    delete content.contact.phone;
  }

  // Filter address to city/state only if privacy setting is false
  if (!privacySettings.show_address && content.contact?.location) {
    content.contact.location = extractCityState(content.contact.location);
  }

  return {
    profile: {
      id: userData.id,
      handle: userData.handle!,
      email: userData.email,
      avatar_url: userData.image,
      headline: userData.headline,
    },
    content,
    theme_id: userData.siteData.themeId,
  };
}

function coerceMetadataString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Lightweight metadata fetcher for SEO.
 * Avoids full Zod validation to keep HEAD requests cheap.
 */
async function fetchResumeMetadataRaw(handle: string): Promise<ResumeMetadata | null> {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  const userData = await db.query.user.findFirst({
    where: eq(user.handle, handle),
    columns: {
      id: true,
      name: true,
      handle: true,
      image: true,
      headline: true,
    },
    with: {
      siteData: {
        columns: {
          content: true,
        },
      },
    },
  });

  if (!userData || !userData.siteData) {
    return null;
  }

  let rawContent: unknown;
  try {
    rawContent = JSON.parse(userData.siteData.content);
  } catch (error) {
    console.error("Failed to parse site_data metadata for handle:", handle, error);
    return null;
  }

  const content = (rawContent ?? {}) as Record<string, unknown>;
  const fullName =
    coerceMetadataString(content.full_name) ?? coerceMetadataString(userData.name) ?? null;

  if (!fullName) {
    return null;
  }

  return {
    full_name: fullName,
    headline: coerceMetadataString(content.headline) ?? userData.headline ?? null,
    summary: coerceMetadataString(content.summary) ?? null,
    avatar_url: userData.image,
  };
}

/**
 * Cached resume data fetcher.
 *
 * Cache behavior:
 * - Keyed by handle (unique per user)
 * - Tagged with `resume:{handle}` for on-demand invalidation
 * - Revalidates every 3600 seconds (1 hour) as a fallback
 * - Invalidated immediately via revalidateTag when user updates content
 *
 * This function does NOT call cookies() or headers(), so it can be used
 * in static/ISR contexts without forcing dynamic rendering.
 *
 * @param handle - The user's unique handle
 * @returns Cached resume data or null if not found
 */
export const getResumeData = (handle: string) => {
  // Local preview can have broken tag cache invalidation; allow disabling cache explicitly.
  if (process.env.DISABLE_RESUME_CACHE === "true") {
    return fetchResumeDataRaw(handle);
  }

  return unstable_cache(() => fetchResumeDataRaw(handle), ["resume-data", handle], {
    tags: [getResumeCacheTag(handle), "resumes"],
    revalidate: 3600, // 1 hour fallback
  })();
};

/**
 * Cached metadata fetcher.
 * Uses same tags for consistent invalidation behavior.
 */
export const getResumeMetadata = (handle: string) => {
  if (process.env.DISABLE_RESUME_CACHE === "true") {
    return fetchResumeMetadataRaw(handle);
  }

  return unstable_cache(() => fetchResumeMetadataRaw(handle), ["resume-metadata", handle], {
    tags: [getResumeCacheTag(handle), "resumes"],
    revalidate: 3600,
  })();
};
