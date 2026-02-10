/**
 * GET /api/admin/analytics?period=7d|30d|90d
 *
 * Returns platform-wide traffic analytics via Umami API.
 */

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { requireAdminAuthForApi } from "@/lib/auth/admin";
import { getMetrics, getPageviews, getStats } from "@/lib/umami/client";

const VALID_PERIODS = new Set(["7d", "30d", "90d"]);

function periodToDays(period: string): number {
  switch (period) {
    case "30d":
      return 30;
    case "90d":
      return 90;
    default:
      return 7;
  }
}

/** Known non-profile top-level routes — anything else with a single segment is a profile. */
const KNOWN_ROUTES = new Set([
  "explore",
  "privacy",
  "terms",
  "preview",
  "reset-password",
  "verify-email",
  "api",
  "dashboard",
  "edit",
  "settings",
  "waiting",
  "wizard",
]);

/** Returns true for paths that are profile URLs (/handle format). */
function isProfilePath(path: string): boolean {
  const segments = path.split("/").filter(Boolean);
  return segments.length === 1 && !KNOWN_ROUTES.has(segments[0]);
}

export async function GET(request: Request) {
  const { error } = await requireAdminAuthForApi();
  if (error) return error;

  const url = new URL(request.url);
  const period = url.searchParams.get("period") || "7d";

  if (!VALID_PERIODS.has(period)) {
    return Response.json({ error: "Invalid period" }, { status: 400 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });

    const days = periodToDays(period);
    const now = Date.now();
    const startAt = now - days * 24 * 60 * 60 * 1000;

    const [stats, pageviews, urlMetrics, referrerMetrics, countryMetrics, deviceMetrics] =
      await Promise.all([
        getStats(env, { startAt, endAt: now }),
        getPageviews(env, { startAt, endAt: now, unit: "day", timezone: "UTC" }),
        getMetrics(env, { type: "url", startAt, endAt: now, limit: 50 }),
        getMetrics(env, { type: "referrer", startAt, endAt: now, limit: 10 }),
        getMetrics(env, { type: "country", startAt, endAt: now, limit: 10 }),
        getMetrics(env, { type: "device", startAt, endAt: now }),
      ]);

    // Totals
    const totalViews = stats.pageviews.value ?? 0;
    const totalUnique = stats.visitors.value ?? 0;
    const prevViews = stats.pageviews.prev ?? 0;
    const prevUnique = stats.visitors.prev ?? 0;
    const avgPerDay = Math.round(totalViews / days);
    const prevAvgPerDay = Math.round(prevViews / days);

    // Changes (percentage)
    const viewsChange =
      prevViews > 0 ? Math.round(((totalViews - prevViews) / prevViews) * 100) : 0;
    const uniqueChange =
      prevUnique > 0 ? Math.round(((totalUnique - prevUnique) / prevUnique) * 100) : 0;
    const avgChange =
      prevAvgPerDay > 0 ? Math.round(((avgPerDay - prevAvgPerDay) / prevAvgPerDay) * 100) : 0;

    // Daily breakdown — map Umami {x, y} to {date, views, unique}
    const sessionMap = new Map(pageviews.sessions.map((s) => [s.x, s.y]));
    const daily = fillMissingDates(
      pageviews.pageviews.map((p) => ({
        date: p.x,
        views: p.y,
        unique: sessionMap.get(p.x) ?? 0,
      })),
      days,
    );

    // Top profiles — filter URL metrics to profile paths only
    const profileMetrics = urlMetrics.filter((m) => isProfilePath(m.x)).slice(0, 10);
    const profilesViewed = profileMetrics.length;

    // Referrers — compute percentages
    const totalReferrer = referrerMetrics.reduce((sum, r) => sum + r.y, 0);

    // Countries — compute percentages
    const totalCountry = countryMetrics.reduce((sum, c) => sum + c.y, 0);

    // Devices — compute percentages
    const totalDevice = deviceMetrics.reduce((sum, d) => sum + d.y, 0);

    return Response.json(
      {
        totals: {
          views: totalViews,
          unique: totalUnique,
          avgPerDay,
          profilesViewed,
        },
        changes: {
          views: viewsChange,
          unique: uniqueChange,
          avgPerDay: avgChange,
        },
        daily,
        topProfiles: profileMetrics.map((m) => ({
          handle: m.x.replace(/^\//, ""),
          views: m.y,
        })),
        referrers: referrerMetrics.map((r) => ({
          domain: r.x || "Direct",
          count: r.y,
          percent: totalReferrer > 0 ? Math.round((r.y / totalReferrer) * 100) : 0,
        })),
        countries: countryMetrics.map((c) => ({
          code: c.x || "unknown",
          name: c.x || "Unknown",
          percent: totalCountry > 0 ? Math.round((c.y / totalCountry) * 100) : 0,
        })),
        devices: deviceMetrics.map((d) => ({
          type: d.x || "unknown",
          percent: totalDevice > 0 ? Math.round((d.y / totalDevice) * 100) : 0,
        })),
      },
      {
        headers: {
          "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (err) {
    console.error("[admin/analytics] Umami API error:", err);
    return Response.json({ error: "Analytics temporarily unavailable" }, { status: 503 });
  }
}

function fillMissingDates(
  data: Array<{ date: string; views: number; unique: number }>,
  days: number,
): Array<{ date: string; views: number; unique: number }> {
  const dataMap = new Map(data.map((d) => [d.date, d]));
  const result: Array<{ date: string; views: number; unique: number }> = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const existing = dataMap.get(date);
    result.push(existing ?? { date, views: 0, unique: 0 });
  }

  return result;
}
