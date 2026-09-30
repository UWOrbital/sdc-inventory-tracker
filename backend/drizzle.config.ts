import "dotenv/config";

import { defineConfig } from "drizzle-kit";

import { databaseEnvSchema } from "./src/platform/env/db.env";

const db = databaseEnvSchema.parse(process.env);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/**/*.schema.ts",
  out: "./drizzle",
  dbCredentials: {
    host: db.DB_HOST,
    port: db.DB_PORT,
    user: db.DB_USER,
    password: db.DB_PASSWORD,
    database: db.DB_NAME,
    ssl: false,
  },
  verbose: true,
});
