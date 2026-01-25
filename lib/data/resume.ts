import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { getDb } from "@/lib/db";
import type { PrivacySettings } from "@/lib/db/schema";
import { user } from "@/lib/db/schema";
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
 * Fetch resume data from D1 via Drizzle WITHOUT using cookies.
 *
 * Privacy filtering is applied during fetch, so returned content
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

  // Parse content JSON (stored as text in D1)
  // Data is already validated at write time (/api/resume/update)
  // D1 is a trusted source - skip redundant Zod validation (saves 200-400ms)
  let content: ResumeContent;
  try {
    content = JSON.parse(userData.siteData.content) as ResumeContent;
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

  // Create defensive copy of contact to avoid mutating parsed JSON
  if (content.contact) {
    content = {
      ...content,
      contact: { ...content.contact },
    };

    // Remove phone if privacy setting is false
    if (!privacySettings.show_phone && content.contact.phone) {
      delete content.contact.phone;
    }

    // Filter address to city/state only if privacy setting is false
    if (!privacySettings.show_address && content.contact.location) {
      content.contact.location = extractCityState(content.contact.location);
    }
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
 * Resume data fetcher with request-level deduplication.
 * Wrapped with React.cache() to avoid duplicate D1 queries when
 * both generateMetadata() and the page component call this function.
 *
 * @param handle - The user's unique handle
 * @returns Resume data or null if not found
 */
export const getResumeData = cache((handle: string) => {
  return fetchResumeDataRaw(handle);
});

/**
 * Metadata fetcher for SEO with request-level deduplication.
 */
export const getResumeMetadata = cache((handle: string) => {
  return fetchResumeMetadataRaw(handle);
});
