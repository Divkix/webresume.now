import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getResumeCacheTag } from "@/lib/data/resume";

export const dynamic = "force-dynamic";

interface InvalidateRequestBody {
  handle: string;
}

/**
 * POST /api/internal/cache/invalidate
 *
 * Internal endpoint for cache invalidation, called by queue consumers
 * or other workers that cannot directly access Next.js cache APIs.
 *
 * Protected by x-internal-auth header matching INTERNAL_CACHE_INVALIDATION_TOKEN env var.
 *
 * Request body:
 * {
 *   handle: string - The user handle whose cache should be invalidated
 * }
 *
 * Response:
 * - 200: Cache invalidated successfully
 * - 400: Invalid request body
 * - 401: Missing or invalid authentication token
 * - 500: Internal error
 */
export async function POST(request: Request) {
  try {
    // 1. Get environment and validate auth token
    const { env } = await getCloudflareContext({ async: true });

    // Access custom env vars via type assertion (not in base Cloudflare.Env)
    const expectedToken = (env as CloudflareEnv).INTERNAL_CACHE_INVALIDATION_TOKEN;
    if (!expectedToken) {
      console.error("INTERNAL_CACHE_INVALIDATION_TOKEN not configured");
      return NextResponse.json({ error: "Internal configuration error" }, { status: 500 });
    }

    // 2. Validate x-internal-auth header
    const authHeader = request.headers.get("x-internal-auth");
    if (!authHeader || authHeader !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. Parse and validate request body
    let body: InvalidateRequestBody;
    try {
      body = (await request.json()) as InvalidateRequestBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 });
    }

    if (!body.handle || typeof body.handle !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'handle' in request body" },
        { status: 400 },
      );
    }

    const handle = body.handle.trim();
    if (handle.length === 0) {
      return NextResponse.json({ error: "Handle cannot be empty" }, { status: 400 });
    }

    // 4. Invalidate cache using Next.js cache APIs
    const cacheTag = getResumeCacheTag(handle);
    revalidateTag(cacheTag, "max");
    revalidatePath(`/${handle}`);

    console.log(`Cache invalidated for handle: ${handle}, tag: ${cacheTag}`);

    // 5. Return success
    return NextResponse.json({
      success: true,
      invalidated: {
        handle,
        tag: cacheTag,
        path: `/${handle}`,
      },
    });
  } catch (error) {
    console.error("Unexpected error in cache invalidation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
