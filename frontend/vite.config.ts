import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defaultClientConditions } from "vite";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Resolve @tracker/shared to its TypeScript source so edits show up without rebuilding it.
  resolve: {
    conditions: ["@tracker/source", ...defaultClientConditions],
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
