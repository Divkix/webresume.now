import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

// For use in API routes and server components where we have access to env
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Database = ReturnType<typeof getDb>;
