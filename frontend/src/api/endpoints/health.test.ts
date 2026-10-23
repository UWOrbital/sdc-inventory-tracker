import { expect, it, vi } from "vitest";
import { request } from "../client";
import { getHealth } from "./health";

vi.mock("../client", () => ({ request: vi.fn() }));

it("requests the health endpoint", async () => {
  vi.mocked(request).mockResolvedValue({ message: "PONG", db: "ok" });
  const signal = new AbortController().signal;
  await expect(getHealth(signal)).resolves.toEqual({ message: "PONG", db: "ok" });
  expect(request).toHaveBeenCalledWith("/", { signal });
});
