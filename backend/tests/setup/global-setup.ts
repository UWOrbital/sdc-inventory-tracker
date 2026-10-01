import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

export default async function setup({ provide }: TestProject) {
  const container = await new PostgreSqlContainer("postgres:18-alpine").start();
  provide("databaseUrl", container.getConnectionUri());

  return async () => {
    await container.stop();
  };
}
