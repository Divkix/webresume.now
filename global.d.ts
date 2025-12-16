declare module "*.css";

/**
 * Extend CloudflareEnv to include our D1 database binding
 * This augments the type from @opennextjs/cloudflare
 */
declare global {
  interface CloudflareEnv {
    DB: D1Database;
  }
}

export {};
