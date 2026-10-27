import { request } from "../client";

type HealthResponse = { message: "PONG"; db: "ok" };

export function getHealth(signal?: AbortSignal) {
  return request<HealthResponse>("/", { signal });
}
