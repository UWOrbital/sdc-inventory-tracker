import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { inject } from "vitest";

import { Database } from "@/platform/database/pool";
import { schema } from "@/platform/database/schema";

export function makeTestDB(): Database {
  const pool = new Pool({ connectionString: inject("databaseUrl") });
  return drizzle({ client: pool, schema });
}

export async function resetDB(db: Database) {
  // CASCADE also clears team_members.
  await db.execute(sql`TRUNCATE TABLE users, teams RESTART IDENTITY CASCADE`);
}
