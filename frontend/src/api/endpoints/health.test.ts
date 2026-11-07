import { expect, it, vi } from "vitest";
import { request } from "@/api/client";
import { getHealth } from "@/api/endpoints/health";

vi.mock("@/api/client", () => ({ request: vi.fn() }));

it("requests the health endpoint", async () => {
  vi.mocked(request).mockResolvedValue({ message: "PONG", db: "ok" });
  const signal = new AbortController().signal;
  await expect(getHealth(signal)).resolves.toEqual({ message: "PONG", db: "ok" });
  expect(request).toHaveBeenCalledWith("/", { signal });
});
