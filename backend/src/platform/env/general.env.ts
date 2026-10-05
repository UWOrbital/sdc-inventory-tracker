import z from "zod";

import { loadEnv } from "@/platform/env/load-env";

export const generalEnvSchema = z.object({
  PORT: z.coerce.number().int().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
});

export type GeneralSettings = z.output<typeof generalEnvSchema>;

export const generalSettings = loadEnv(generalEnvSchema);
