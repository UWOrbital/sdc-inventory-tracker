import z from "zod";

export const databaseEnvSchema = z.object({
  DB_NAME: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
});

export type DatabaseSettings = z.output<typeof databaseEnvSchema>;
