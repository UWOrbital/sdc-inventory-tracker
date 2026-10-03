import "dotenv/config";

import z from "zod";

import { authEnvSchema } from "@/platform/env/auth.env";
import { corsEnvSchema } from "@/platform/env/cors.env";
import { databaseEnvSchema } from "@/platform/env/db.env";
import { generalEnvSchema } from "@/platform/env/general.env";
import { logger } from "@/platform/logger";

function loadEnv<S extends z.ZodType>(schema: S): Readonly<z.output<S>> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    logger.fatal({ details: z.prettifyError(result.error) }, "Invalid environment configuration");
    logger.flush();
    process.exit(1);
  }
  return Object.freeze(result.data);
}

export class BackendSettings {
  public readonly cors = loadEnv(corsEnvSchema);
  public readonly general = loadEnv(generalEnvSchema);
  public readonly db = loadEnv(databaseEnvSchema);
  public readonly auth = loadEnv(authEnvSchema);
}

export const settings = new BackendSettings();
