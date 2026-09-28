import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { BackendSettings } from "@/platform/env/backend.env";

export function makeDB(settings: BackendSettings) {
  const pool = new Pool({
    host: settings.db.DB_HOST,
    user: settings.db.DB_USER,
    password: settings.db.DB_PASSWORD,
    application_name: settings.db.DB_NAME,
    port: settings.db.DB_PORT,
  });

  return drizzle({ client: pool });
}

export type Database = ReturnType<typeof makeDB>;
