import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Create an anonymous Supabase client that does NOT use cookies.
 *
 * This client is safe for use in cached/static contexts because it:
 * - Does NOT call cookies() or headers()
 * - Uses only the public anon key (respects RLS)
 * - Can be used inside unstable_cache without triggering dynamic rendering
 *
 * Use cases:
 * - Public pages like /[handle] that need ISR/static caching
 * - Any read-only query that doesn't require user authentication
 *
 * DO NOT use for:
 * - Any operation requiring user authentication
 * - Writes that need RLS user context
 */
export function createAnonClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public credentials");
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
