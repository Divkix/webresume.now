/**
 * Shared cleanup logic for database maintenance.
 *
 * Called by:
 * - worker.ts scheduled handler (direct invocation, no extra Worker billing)
 * - /api/cron/cleanup route handler (manual trigger via HTTP)
 *
 * Deletes:
 * - Expired rate limits (expiresAt < now)
 * - Expired sessions (expiresAt < now)
 * - Old handleChanges (older than 90 days)
 * - Old pageViews (older than 90 days)
 */

import { lt } from "drizzle-orm";
import type { Database } from "@/lib/db";
import { handleChanges, pageViews, session, uploadRateLimits } from "@/lib/db/schema";

export interface CleanupResult {
  ok: true;
  deleted: {
    rateLimits: number;
    sessions: number;
    handleChanges: number;
    pageViews: number;
  };
  timestamp: string;
}

export async function performCleanup(db: Database): Promise<CleanupResult> {
  const nowIso = new Date().toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  // Delete expired rate limits
  const rateLimitsResult = await db
    .delete(uploadRateLimits)
    .where(lt(uploadRateLimits.expiresAt, nowIso));

  // Delete expired sessions
  const sessionsResult = await db.delete(session).where(lt(session.expiresAt, nowIso));

  // Archive old handleChanges (keep 90 days)
  const handleChangesResult = await db
    .delete(handleChanges)
    .where(lt(handleChanges.createdAt, ninetyDaysAgo));

  // Delete page views older than 90 days
  const pageViewsResult = await db.delete(pageViews).where(lt(pageViews.createdAt, ninetyDaysAgo));

  return {
    ok: true,
    deleted: {
      rateLimits: rateLimitsResult.meta.changes,
      sessions: sessionsResult.meta.changes,
      handleChanges: handleChangesResult.meta.changes,
      pageViews: pageViewsResult.meta.changes,
    },
    timestamp: nowIso,
  };
}
