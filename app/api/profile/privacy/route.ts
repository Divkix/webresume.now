import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireAuthWithMessage } from "@/lib/auth/middleware";
import { getResumeCacheTag } from "@/lib/data/resume";
import { user } from "@/lib/db/schema";
import { getSessionDb } from "@/lib/db/session";
import { privacySettingsSchema } from "@/lib/schemas/profile";
import { enforceRateLimit } from "@/lib/utils/rate-limit";
import {
  createErrorResponse,
  createSuccessResponse,
  ERROR_CODES,
} from "@/lib/utils/security-headers";

/**
 * PUT /api/profile/privacy
 * Update user's privacy settings (show_phone, show_address)
 * Rate limit: 20 updates per hour (more generous for toggle settings)
 */
export async function PUT(request: Request) {
  try {
    // 1. Authenticate user
    const authResult = await requireAuthWithMessage(
      "You must be logged in to update privacy settings",
    );
    if (authResult.error) return authResult.error;
    const { user: authUser } = authResult;

    // 2. Rate limit check (20 updates per hour)
    const rateLimitResponse = await enforceRateLimit(authUser.id, "privacy_update");
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // 3. Get database connection
    const { env } = await getCloudflareContext({ async: true });
    const { db, captureBookmark } = await getSessionDb(env.DB);

    // 4. Fetch user's handle for cache invalidation
    const userRecord = await db
      .select({ handle: user.handle })
      .from(user)
      .where(eq(user.id, authUser.id))
      .limit(1);

    const userHandle = userRecord[0]?.handle;

    // 5. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return createErrorResponse("Invalid JSON in request body", ERROR_CODES.BAD_REQUEST, 400);
    }

    const validation = privacySettingsSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(
        "Invalid privacy settings data",
        ERROR_CODES.VALIDATION_ERROR,
        400,
        validation.error.issues,
      );
    }

    const { show_phone, show_address } = validation.data;

    // 6. Update privacy_settings (stored as JSON string in D1)
    const privacySettings = JSON.stringify({
      show_phone,
      show_address,
    });

    await db
      .update(user)
      .set({
        privacySettings,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(user.id, authUser.id));

    // 7. Invalidate cache for public page so privacy changes reflect immediately
    // This prevents PII exposure through stale ISR cache
    if (userHandle) {
      revalidateTag(getResumeCacheTag(userHandle));
      revalidatePath(`/${userHandle}`);
    }

    await captureBookmark();
    return createSuccessResponse({
      success: true,
      privacy_settings: {
        show_phone,
        show_address,
      },
    });
  } catch (err) {
    console.error("Unexpected error in privacy update:", err);
    return createErrorResponse(
      "An unexpected error occurred. Please try again.",
      ERROR_CODES.INTERNAL_ERROR,
      500,
    );
  }
}
