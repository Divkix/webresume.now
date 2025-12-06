import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { validateEnvironment } from "@/lib/env";
import { getR2Bucket, getR2Client } from "@/lib/r2";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint
 * Verifies environment config and service connectivity
 */
export async function GET() {
  const checks = {
    environment: false,
    database: false,
    r2: false,
    timestamp: new Date().toISOString(),
  };

  // Check environment variables
  try {
    validateEnvironment();
    checks.environment = true;
  } catch {
    return NextResponse.json(
      { status: "error", checks, error: "Environment validation failed" },
      { status: 500 },
    );
  }

  // Check D1 database connection
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = getDb(env.DB);
    // Try to query the user table
    await db.select({ id: user.id }).from(user).limit(1);
    // Error is okay if no users exist, we just want to verify connection
    checks.database = true;
  } catch (err) {
    console.error("Database health check failed:", err);
  }

  // Check R2 connection
  try {
    const r2Client = getR2Client();
    const R2_BUCKET = getR2Bucket();
    await r2Client.send(new HeadBucketCommand({ Bucket: R2_BUCKET }));
    checks.r2 = true;
  } catch (err) {
    console.error("R2 health check failed:", err);
  }

  const allHealthy = checks.environment && checks.database && checks.r2;

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
