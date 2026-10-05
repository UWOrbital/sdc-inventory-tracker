import "dotenv/config";

import z from "zod";

export function loadEnv<S extends z.ZodType>(schema: S): Readonly<z.output<S>> {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    // Configuration must be valid before the logger can be initialized.
    console.error("Invalid environment configuration:", z.prettifyError(result.error));
    process.exit(1);
  }
  return Object.freeze(result.data);
}
