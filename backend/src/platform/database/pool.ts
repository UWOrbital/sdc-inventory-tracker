import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { schema } from "@/platform/database/schema";
import { BackendSettings } from "@/platform/env/backend.env";

export function makeDB(settings: BackendSettings) {
  const pool = new Pool({
    host: settings.db.DB_HOST,
    user: settings.db.DB_USER,
    password: settings.db.DB_PASSWORD,
    database: settings.db.DB_NAME,
    port: settings.db.DB_PORT,
  });

  return drizzle({ client: pool, schema });
}

export type Database = ReturnType<typeof makeDB>;
