/**
 * Server-side Better Auth configuration for Next.js 15 with Cloudflare D1
 *
 * IMPORTANT: The auth instance must be created inside request handlers because
 * the D1 database binding is only available within the Cloudflare Workers
 * request context. Attempting to create the instance at module scope will fail.
 *
 * Environment variables are loaded from:
 * - Production: Cloudflare Workers env bindings (via wrangler secret put)
 * - Development: process.env (via .env.local)
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import type { CloudflareEnv } from "@/lib/cloudflare-env";
import * as schema from "@/lib/db/schema";

/**
 * Get env value with Cloudflare binding fallback to process.env
 */
function getEnvValue(env: Partial<CloudflareEnv>, key: keyof CloudflareEnv): string {
  const cfValue = env[key];
  if (typeof cfValue === "string" && cfValue.trim() !== "") {
    return cfValue;
  }
  const processValue = process.env[key];
  if (processValue && processValue.trim() !== "") {
    return processValue;
  }
  throw new Error(
    `Missing required environment variable: ${key}. ` +
      `Set it via .env.local (dev) or 'wrangler secret put ${key}' (prod).`,
  );
}

/**
 * Creates a Better Auth instance with D1 binding from the current request context
 *
 * This function must be called within an API route handler or server action
 * where the Cloudflare request context is available.
 *
 * @returns Configured Better Auth instance
 *
 * @example
 * ```ts
 * // In an API route
 * export async function GET(request: Request) {
 *   const auth = await getAuth();
 *   return auth.handler(request);
 * }
 * ```
 */
export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const typedEnv = env as Partial<CloudflareEnv>;
  const db = drizzle(env.DB, { schema });

  // Get secrets from Cloudflare env with fallback to process.env
  const baseURL = getEnvValue(typedEnv, "BETTER_AUTH_URL");
  const secret = getEnvValue(typedEnv, "BETTER_AUTH_SECRET");
  const googleClientId = getEnvValue(typedEnv, "GOOGLE_CLIENT_ID");
  const googleClientSecret = getEnvValue(typedEnv, "GOOGLE_CLIENT_SECRET");

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    baseURL,
    secret,
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
      },
    },
    user: {
      additionalFields: {
        handle: {
          type: "string",
          required: false,
          input: true,
        },
        headline: {
          type: "string",
          required: false,
          input: true,
        },
        privacySettings: {
          type: "string",
          required: false,
          defaultValue: '{"show_phone":false,"show_address":false}',
          input: true,
        },
        onboardingCompleted: {
          type: "boolean",
          required: false,
          defaultValue: false,
          input: true,
        },
        role: {
          type: "string",
          required: false,
          input: true,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      updateAge: 60 * 60 * 24, // Update session if older than 1 day
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes cache
      },
    },
    trustedOrigins: [baseURL].filter(Boolean),
  });
}

/**
 * Type export for the auth instance
 * Useful for typing auth-related utilities
 */
export type Auth = Awaited<ReturnType<typeof getAuth>>;
