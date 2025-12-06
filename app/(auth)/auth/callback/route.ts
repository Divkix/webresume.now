import { NextResponse } from "next/server";

/**
 * Legacy Supabase OAuth callback route
 *
 * This route is no longer used since we migrated to Better Auth.
 * Better Auth handles OAuth callbacks at `/api/auth/callback/google`.
 *
 * This route now just redirects to the wizard page for any old links
 * or bookmarks that might still point here.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const origin = requestUrl.origin;

  // Redirect to wizard - Better Auth handles the actual callback
  return NextResponse.redirect(`${origin}/wizard`);
}
