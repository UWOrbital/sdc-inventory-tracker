import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ApiError, request } from "./client";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubEnv("VITE_API_URL", "http://localhost:3000/");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("uses the configured URL, sends cookies, and returns JSON", async () => {
  fetchMock.mockResolvedValue(Response.json({ name: "Test User" }));

  await expect(request("/users/me")).resolves.toEqual({ name: "Test User" });
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:3000/users/me",
    expect.objectContaining({ credentials: "include" }),
  );
});

it("serializes a JSON body and preserves custom headers", async () => {
  fetchMock.mockResolvedValue(Response.json({ name: "Test User" }));
  await request("/users/me", {
    method: "PATCH",
    body: { name: "Test User" },
    headers: { "X-Request-ID": "test-id" },
  });

  const options = fetchMock.mock.calls[0]![1]!;
  expect(options.method).toBe("PATCH");
  expect(options.body).toBe(JSON.stringify({ name: "Test User" }));
  const headers = new Headers(options.headers);
  expect(headers.get("Content-Type")).toBe("application/json");
  expect(headers.get("X-Request-ID")).toBe("test-id");
});

it("returns undefined for a 204 response", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  await expect(request<void>("/users/me", { method: "DELETE" })).resolves.toBeUndefined();
});

it("exposes the status and backend error details", async () => {
  const details = { error: "Invalid request body", issues: { name: ["Invalid name"] } };
  fetchMock.mockResolvedValue(Response.json(details, { status: 400 }));
  await expect(request("/users/me")).rejects.toMatchObject({
    name: "ApiError",
    message: details.error,
    status: 400,
    details,
  });
});

it("handles non-JSON error responses", async () => {
  fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));
  await expect(request("/users/me")).rejects.toMatchObject({
    message: "Request failed (502)",
    status: 502,
  });
});

it("rejects malformed JSON on a successful response", async () => {
  fetchMock.mockResolvedValue(new Response("not json"));
  await expect(request("/users/me")).rejects.toBeInstanceOf(ApiError);
});

it("preserves network failures", async () => {
  const error = new TypeError("Failed to fetch");
  fetchMock.mockRejectedValue(error);
  await expect(request("/users/me")).rejects.toBe(error);
});

it("requires an API URL before making a request", async () => {
  vi.stubEnv("VITE_API_URL", "");
  await expect(request("/users/me")).rejects.toThrow("VITE_API_URL must be configured");
  expect(fetchMock).not.toHaveBeenCalled();
});
