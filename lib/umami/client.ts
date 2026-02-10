/**
 * Umami Analytics API client for self-hosted instance.
 *
 * Auth: JWT via POST /api/auth/login. Token cached module-level
 * for 1 hour, auto-cleared on 401 with single retry.
 *
 * Runs on Cloudflare Workers — env vars from CloudflareEnv binding.
 *
 * Compatible with Umami v2.12+ API format:
 * - Stats return flat numbers + comparison object
 * - Metrics require unit + timezone, type "url" renamed to "path"
 * - Filters use simple query params (e.g. path=/@handle)
 */

const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "";
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 5_000; // 5 seconds

// Module-level token cache (reset per isolate lifetime)
let cachedToken: string | null = null;
let tokenTimestamp = 0;

// --- Types ---

/** Umami v2.12+ stats response — flat numbers with comparison object. */
export interface UmamiStats {
  pageviews: number;
  visitors: number;
  visits: number;
  bounces: number;
  totaltime: number;
  comparison: {
    pageviews: number;
    visitors: number;
    visits: number;
    bounces: number;
    totaltime: number;
  };
}

export interface UmamiPageviews {
  pageviews: Array<{ x: string; y: number }>;
  sessions: Array<{ x: string; y: number }>;
}

export interface UmamiMetric {
  x: string;
  y: number;
}

interface StatsOptions {
  startAt: number;
  endAt: number;
  /** Filter by URL path (e.g. "/@handle") */
  path?: string;
}

interface PageviewsOptions {
  startAt: number;
  endAt: number;
  unit: string;
  timezone: string;
  /** Filter by URL path (e.g. "/@handle") */
  path?: string;
}

interface MetricsOptions {
  startAt: number;
  endAt: number;
  type: string;
  unit: string;
  timezone: string;
  /** Filter by URL path (e.g. "/@handle") */
  path?: string;
  limit?: number;
}

// --- Auth ---

function clearTokenCache() {
  cachedToken = null;
  tokenTimestamp = 0;
}

export async function getUmamiToken(env: CloudflareEnv): Promise<string> {
  if (cachedToken && Date.now() - tokenTimestamp < TOKEN_TTL_MS) {
    return cachedToken;
  }

  const apiUrl = env.UMAMI_API_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: env.UMAMI_USERNAME,
        password: env.UMAMI_PASSWORD,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Umami auth failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { token: string };
    cachedToken = data.token;
    tokenTimestamp = Date.now();
    return cachedToken;
  } finally {
    clearTimeout(timeout);
  }
}

// --- Internal helpers ---

/** Append path filter as a simple query param (Umami v2.12+ format). */
function appendPathFilter(params: URLSearchParams, path?: string) {
  if (path) {
    params.set("path", path);
  }
}

async function umamiGet<T>(
  env: CloudflareEnv,
  path: string,
  params: URLSearchParams,
  retry = true,
): Promise<T> {
  const token = await getUmamiToken(env);
  const apiUrl = env.UMAMI_API_URL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(`${apiUrl}${path}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });

    if (res.status === 401 && retry) {
      clearTokenCache();
      clearTimeout(timeout);
      return umamiGet<T>(env, path, params, false);
    }

    if (!res.ok) {
      throw new Error(`Umami API error: ${res.status} ${res.statusText} for ${path}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

// --- Public API ---

export async function getStats(env: CloudflareEnv, opts: StatsOptions): Promise<UmamiStats> {
  const params = new URLSearchParams({
    startAt: opts.startAt.toString(),
    endAt: opts.endAt.toString(),
  });
  appendPathFilter(params, opts.path);

  return umamiGet<UmamiStats>(env, `/api/websites/${WEBSITE_ID}/stats`, params);
}

export async function getPageviews(
  env: CloudflareEnv,
  opts: PageviewsOptions,
): Promise<UmamiPageviews> {
  const params = new URLSearchParams({
    startAt: opts.startAt.toString(),
    endAt: opts.endAt.toString(),
    unit: opts.unit,
    timezone: opts.timezone,
  });
  appendPathFilter(params, opts.path);

  return umamiGet<UmamiPageviews>(env, `/api/websites/${WEBSITE_ID}/pageviews`, params);
}

export async function getMetrics(env: CloudflareEnv, opts: MetricsOptions): Promise<UmamiMetric[]> {
  const params = new URLSearchParams({
    startAt: opts.startAt.toString(),
    endAt: opts.endAt.toString(),
    type: opts.type,
    unit: opts.unit,
    timezone: opts.timezone,
  });
  if (opts.limit) {
    params.set("limit", opts.limit.toString());
  }
  appendPathFilter(params, opts.path);

  return umamiGet<UmamiMetric[]>(env, `/api/websites/${WEBSITE_ID}/metrics`, params);
}
