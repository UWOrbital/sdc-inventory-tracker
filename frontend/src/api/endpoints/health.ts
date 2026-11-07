import { request } from "@/api/client";

type HealthResponse = { message: "PONG"; db: "ok" };

export function getHealth(signal?: AbortSignal) {
  return request<HealthResponse>("/", { signal });
}
