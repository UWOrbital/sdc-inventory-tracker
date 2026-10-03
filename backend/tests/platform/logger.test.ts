import { describe, expect, it } from "vitest";

import { createLogger } from "@/platform/logger";

describe("application logger", () => {
  it("serializes errors and request IDs while redacting sensitive fields", () => {
    const lines: string[] = [];
    const log = createLogger({
      write: (line) => {
        lines.push(line);
      },
    });
    log.level = "info";
    log
      .child({ requestId: "test-id" })
      .error(
        { err: new Error("Database unavailable"), password: "secret", token: "secret" },
        "Operation failed",
      );
    const entry: unknown = JSON.parse(lines[0]);
    expect(entry).toMatchObject({
      requestId: "test-id",
      msg: "Operation failed",
      err: { type: "Error", message: "Database unavailable" },
      password: "[Redacted]",
      token: "[Redacted]",
    });
  });

  it("filters messages below the configured level", () => {
    const lines: string[] = [];
    const log = createLogger({
      write: (line) => {
        lines.push(line);
      },
    });
    log.level = "warn";
    log.info("Hidden");
    log.warn("Visible");
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toMatchObject({ msg: "Visible" });
  });
});
