import { authEnvSchema } from "@/platform/env/auth.env";
import { corsEnvSchema } from "@/platform/env/cors.env";
import { databaseEnvSchema } from "@/platform/env/db.env";
import { generalSettings } from "@/platform/env/general.env";
import { loadEnv } from "@/platform/env/load-env";

export class BackendSettings {
  public readonly cors = loadEnv(corsEnvSchema);
  public readonly general = generalSettings;
  public readonly db = loadEnv(databaseEnvSchema);
  public readonly auth = loadEnv(authEnvSchema);
}

export const settings = new BackendSettings();
