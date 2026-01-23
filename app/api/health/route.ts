import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getR2Binding } from "@/lib/r2";

export const dynamic = "force-dynamic";

type ServiceStatus = "healthy" | "unhealthy" | "degraded";

interface ServiceHealth {
  status: ServiceStatus;
  latencyMs?: number;
  error?: string;
}

interface HealthResponse {
  status: ServiceStatus;
  timestamp: string;
  services: {
    d1: ServiceHealth;
    r2: ServiceHealth;
    pdfWorker: ServiceHealth;
    aiParser: ServiceHealth;
  };
}

async function checkD1(db: D1Database): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await db.prepare("SELECT 1").first();
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkR2(r2: R2Bucket): Promise<ServiceHealth> {
  const start = Date.now();
  try {
    await r2.list({ limit: 1 });
    return { status: "healthy", latencyMs: Date.now() - start };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkServiceBinding(
  worker: Fetcher | undefined,
  name: string,
): Promise<ServiceHealth> {
  if (!worker) {
    return { status: "unhealthy", error: `${name} binding not available` };
  }

  const start = Date.now();
  try {
    // Attempt to call a health endpoint or simple request
    const response = await worker.fetch("https://internal/health", {
      method: "GET",
    });

    // Even a 404 means the worker is responding
    if (response.status === 404 || response.ok) {
      return { status: "healthy", latencyMs: Date.now() - start };
    }

    return {
      status: "degraded",
      latencyMs: Date.now() - start,
      error: `Unexpected status: ${response.status}`,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function aggregateStatus(services: HealthResponse["services"]): ServiceStatus {
  const statuses = Object.values(services).map((s) => s.status);
  if (statuses.every((s) => s === "healthy")) return "healthy";
  if (statuses.some((s) => s === "unhealthy")) return "unhealthy";
  return "degraded";
}

/**
 * GET /api/health
 *
 * Returns health status of all service bindings:
 * - D1 database
 * - R2 bucket
 * - PDF text worker
 * - AI parser worker
 */
export async function GET() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const typedEnv = env as CloudflareEnv;

    const r2Binding = getR2Binding(typedEnv);

    // Run all health checks in parallel
    const [d1Health, r2Health, pdfHealth, aiHealth] = await Promise.all([
      checkD1(env.DB),
      r2Binding
        ? checkR2(r2Binding)
        : Promise.resolve({ status: "unhealthy" as const, error: "R2 binding not available" }),
      checkServiceBinding(typedEnv.PDF_TEXT_WORKER, "PDF_TEXT_WORKER"),
      checkServiceBinding(typedEnv.AI_PARSER_WORKER, "AI_PARSER_WORKER"),
    ]);

    const services = {
      d1: d1Health,
      r2: r2Health,
      pdfWorker: pdfHealth,
      aiParser: aiHealth,
    };

    const response: HealthResponse = {
      status: aggregateStatus(services),
      timestamp: new Date().toISOString(),
      services,
    };

    const httpStatus =
      response.status === "healthy" ? 200 : response.status === "degraded" ? 200 : 503;

    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 503 },
    );
  }
}
