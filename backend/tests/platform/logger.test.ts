import pino from "pino";
import { describe, expect, it, vi } from "vitest";

import { createLogger } from "@/platform/logger";

describe("application logger", () => {
  it("routes normal logs to stdout and errors to stderr without duplicates", () => {
    const stdout = pino.destination({ dest: 1, sync: true });
    const stderr = pino.destination({ dest: 2, sync: true });
    const stdoutWrite = vi.spyOn(stdout, "write").mockReturnValue(true);
    const stderrWrite = vi.spyOn(stderr, "write").mockReturnValue(true);
    vi.spyOn(pino, "destination").mockReturnValueOnce(stdout).mockReturnValueOnce(stderr);

    const log = createLogger();
    log.level = "trace";
    log.trace("trace");
    log.debug("debug");
    log.info("info");
    log.warn("warn");
    log.error("error");
    log.fatal("fatal");

    expect(stdoutWrite).toHaveBeenCalledTimes(4);
    expect(stderrWrite).toHaveBeenCalledTimes(2);
    expect(stdoutWrite).toHaveBeenLastCalledWith(expect.stringContaining('"msg":"warn"'));
    expect(stderrWrite).toHaveBeenNthCalledWith(1, expect.stringContaining('"msg":"error"'));
    expect(stderrWrite).toHaveBeenNthCalledWith(2, expect.stringContaining('"msg":"fatal"'));
  });

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
