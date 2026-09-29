import "dotenv/config";

import z from "zod";

import { corsEnvSchema } from "@/platform/env/cors.env";
import { databaseEnvSchema } from "@/platform/env/db.env";
import { generalEnvSchema } from "@/platform/env/general.env";

function loadEnv<S extends z.ZodType>(schema: S): Readonly<z.output<S>> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    console.error("Invalid environment configuration:");
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }
  return Object.freeze(result.data);
}

export class BackendSettings {
  public readonly cors = loadEnv(corsEnvSchema);
  public readonly general = loadEnv(generalEnvSchema);
  public readonly db = loadEnv(databaseEnvSchema);
}

export const settings = new BackendSettings();
