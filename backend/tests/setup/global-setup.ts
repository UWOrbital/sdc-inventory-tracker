import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup({ provide }: TestProject) {
  const container = await new PostgreSqlContainer("postgres:18-alpine").start();

  // Apply the committed migrations the same way `npm run db:migrate` does. drizzle.config.ts
  // loads .env via dotenv, which never overrides variables that are already set.
  await promisify(execFile)("node_modules/.bin/drizzle-kit", ["migrate"], {
    env: {
      ...process.env,
      DB_HOST: container.getHost(),
      DB_PORT: String(container.getPort()),
      DB_USER: container.getUsername(),
      DB_PASSWORD: container.getPassword(),
      DB_NAME: container.getDatabase(),
    },
  });

  provide("databaseUrl", container.getConnectionUri());

  return async () => {
    await container.stop();
  };
}
