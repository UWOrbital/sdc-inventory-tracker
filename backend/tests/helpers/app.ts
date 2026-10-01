import { createApp } from "@/app";
import { Database } from "@/platform/database/pool";
import { authEnvSchema } from "@/platform/env/auth.env";
import { BackendSettings } from "@/platform/env/backend.env";
import { corsEnvSchema } from "@/platform/env/cors.env";
import { generalEnvSchema } from "@/platform/env/general.env";

export const TEST_JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";

export function makeTestSettings(): BackendSettings {
  return {
    cors: corsEnvSchema.parse({}),
    general: generalEnvSchema.parse({}),
    db: { DB_NAME: "", DB_HOST: "", DB_PORT: 0, DB_USER: "", DB_PASSWORD: "" },
    auth: authEnvSchema.parse({ JWT_SECRET: TEST_JWT_SECRET }),
  };
}

export function makeTestApp(db: Database) {
  return createApp(makeTestSettings(), db);
}
