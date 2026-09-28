import z from "zod";

export const generalEnvSchema = z.object({
  PORT: z.coerce.number().int().default(3000),
});

export type GeneralSettings = z.output<typeof generalEnvSchema>;
