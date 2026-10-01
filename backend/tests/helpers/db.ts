import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { inject } from "vitest";

import { Database } from "@/platform/database/pool";

export function makeTestDB(): Database {
  const pool = new Pool({ connectionString: inject("databaseUrl") });
  return drizzle({ client: pool });
}

export async function resetDB(db: Database) {
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE`);
}
