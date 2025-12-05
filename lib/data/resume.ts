import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/supabase/anon";
import type { ResumeContent } from "@/lib/types/database";
import { extractCityState, isValidPrivacySettings } from "@/lib/utils/privacy";

interface PrivacySettings {
  show_phone: boolean;
  show_address: boolean;
}

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

/**
 * Cache tag format for resume pages.
 * Used for on-demand revalidation via revalidateTag.
 */
export function getResumeCacheTag(handle: string): string {
  return `resume:${handle}`;
}

/**
 * Fetch resume data from Supabase WITHOUT using cookies.
 * This is the raw fetcher that gets wrapped by unstable_cache.
 *
 * Privacy filtering is applied at cache time, so cached content
 * is already privacy-filtered.
 */
async function fetchResumeDataRaw(handle: string): Promise<ResumeData | null> {
  const supabase = createAnonClient();

  // Fetch profile with site_data in a single query
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id,
      handle,
      email,
      avatar_url,
      headline,
      privacy_settings,
      site_data (
        content,
        theme_id,
        last_published_at
      )
    `,
    )
    .eq("handle", handle)
    .single();

  if (error || !data) {
    return null;
  }

  // Ensure site_data exists
  if (!data.site_data) {
    return null;
  }

  const siteData = Array.isArray(data.site_data) ? data.site_data[0] : data.site_data;

  // Deep clone content to avoid mutation
  const content: ResumeContent = JSON.parse(JSON.stringify(siteData.content));

  // Apply privacy filtering with type guard
  const privacySettings: PrivacySettings = isValidPrivacySettings(data.privacy_settings)
    ? data.privacy_settings
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
      id: data.id,
      handle: data.handle,
      email: data.email,
      avatar_url: data.avatar_url,
      headline: data.headline,
    },
    content,
    theme_id: siteData.theme_id,
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
export const getResumeData = (handle: string) =>
  unstable_cache(() => fetchResumeDataRaw(handle), ["resume-data", handle], {
    tags: [getResumeCacheTag(handle), "resumes"],
    revalidate: 3600, // 1 hour fallback
  })();
