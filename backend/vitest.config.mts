import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // Resolve @tracker/shared to its TypeScript source so tests never run against a stale build.
  ssr: {
    resolve: {
      conditions: ["@tracker/source"],
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/setup/global-setup.ts"],
    restoreMocks: true,
  },
});
