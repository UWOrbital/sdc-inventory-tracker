import z from "zod";

export const authEnvSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(3600),
  AUTH_COOKIE_SECURE: z.stringbool().default(false),
});

export type AuthSettings = z.output<typeof authEnvSchema>;
