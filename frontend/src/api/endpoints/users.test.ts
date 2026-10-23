import { beforeEach, expect, it, vi } from "vitest";
import { request } from "../client";
import {
  activateUser,
  deactivateCurrentUser,
  deactivateUser,
  deleteUser,
  getCurrentUser,
  getUsers,
  updateCurrentUser,
} from "./users";

vi.mock("../client", () => ({ request: vi.fn() }));
const requestMock = vi.mocked(request);
const user = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  email: "test@example.com",
  name: "Test User",
  role: "member",
  createdAt: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  requestMock.mockReset();
});

it("gets the current user and decodes the date", async () => {
  requestMock.mockResolvedValue(user);
  const signal = new AbortController().signal;
  const result = await getCurrentUser(signal);
  expect(requestMock).toHaveBeenCalledWith("/users/me", { signal });
  expect(result).toEqual({ ...user, createdAt: new Date(user.createdAt) });
});

it("gets the user list", async () => {
  requestMock.mockResolvedValue({ users: [user] });
  const result = await getUsers();
  expect(requestMock).toHaveBeenCalledWith("/users", { signal: undefined });
  expect(result.users[0]?.createdAt).toEqual(new Date(user.createdAt));
});

it("updates only fields allowed by the shared schema", async () => {
  requestMock.mockResolvedValue(user);
  const input = { name: "Test User", role: "superuser" };
  await updateCurrentUser(input);
  expect(requestMock).toHaveBeenCalledWith("/users/me", {
    method: "PATCH",
    body: { name: "Test User" },
  });
});

it("rejects invalid user data returned by the server", async () => {
  requestMock.mockResolvedValue({ id: "invalid" });
  await expect(getCurrentUser()).rejects.toThrow();
});

it("deactivates the current account", async () => {
  const result = { message: "Your account has been deactivated." };
  requestMock.mockResolvedValue(result);
  await expect(deactivateCurrentUser()).resolves.toEqual(result);
  expect(requestMock).toHaveBeenCalledWith("/users/me", { method: "DELETE" });
});

it.each([
  [deleteUser, "", "DELETE"],
  [activateUser, "/activate", "POST"],
  [deactivateUser, "/deactivate", "POST"],
] as const)("calls the correct admin route (%s)", async (operation, suffix, method) => {
  requestMock.mockResolvedValue({ message: "Success" });
  await expect(operation(user.id)).resolves.toEqual({ message: "Success" });
  expect(requestMock).toHaveBeenCalledWith(`/users/${user.id}${suffix}`, { method });
});

it("rejects invalid IDs before making a request", () => {
  expect(() => deleteUser("not-a-uuid")).toThrow();
  expect(requestMock).not.toHaveBeenCalled();
});

it("preserves request failures for callers to handle", async () => {
  const error = new Error("Network unavailable");
  requestMock.mockRejectedValue(error);
  await expect(getCurrentUser()).rejects.toBe(error);
});
