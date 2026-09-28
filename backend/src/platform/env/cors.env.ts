import { z } from "zod";

const csv = (fallback: string) =>
  z
    .string()
    .default(fallback)
    .transform((s) =>
      s
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean),
    );

export const corsEnvSchema = z.object({
  CORS_ALLOW_ORIGINS: csv("http://localhost:5173"),
  CORS_ALLOW_CREDENTIALS: z.stringbool().default(true),
  CORS_ALLOW_METHODS: csv("*"),
  CORS_ALLOW_HEADERS: csv("*"),
});

export type CORSSettings = z.output<typeof corsEnvSchema>;
