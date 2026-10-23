import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import * as users from "../api/endpoints/users";
import {
  userKeys,
  useCurrentUser,
  useDeactivateCurrentUser,
  useUpdateCurrentUser,
  useDeleteUser,
  useActivateUser,
  useDeactivateUser,
} from "./useUsers";

vi.mock("../api/endpoints/users");
afterEach(() => {
  vi.resetAllMocks();
});

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, wrapper };
}

const user = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  email: "test@example.com",
  name: "Test User",
  role: "member" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

it("exposes current user data", async () => {
  vi.mocked(users.getCurrentUser).mockResolvedValue(user);
  const { wrapper } = setup();
  const { result } = renderHook(() => useCurrentUser(), { wrapper });
  expect(result.current.isPending).toBe(true);
  await waitFor(() => expect(result.current.data).toEqual(user));
});

it("exposes request errors without retrying the current user request", async () => {
  const error = new Error("Unauthorized");
  vi.mocked(users.getCurrentUser).mockRejectedValue(error);
  const { wrapper } = setup();
  const { result } = renderHook(() => useCurrentUser(), { wrapper });
  await waitFor(() => expect(result.current.error).toBe(error));
  expect(users.getCurrentUser).toHaveBeenCalledTimes(1);
});

it("invalidates user data after a profile update", async () => {
  vi.mocked(users.updateCurrentUser).mockResolvedValue(user);
  const { client, wrapper } = setup();
  client.setQueryData(userKeys.current, user);
  client.setQueryData(userKeys.list, { users: [user] });
  const { result } = renderHook(() => useUpdateCurrentUser(), { wrapper });
  await act(() => result.current.mutateAsync({ name: "Test User" }));
  expect(client.getQueryState(userKeys.current)?.isInvalidated).toBe(true);
  expect(client.getQueryState(userKeys.list)?.isInvalidated).toBe(true);
  client.clear();
});

it.each([
  [useDeleteUser, users.deleteUser],
  [useActivateUser, users.activateUser],
  [useDeactivateUser, users.deactivateUser],
] as const)("invalidates users after an admin mutation (%s)", async (useHook, endpoint) => {
  vi.mocked(endpoint).mockResolvedValue({ message: "Success" });
  const { client, wrapper } = setup();
  client.setQueryData(userKeys.list, { users: [user] });
  const { result } = renderHook(() => useHook(), { wrapper });
  await act(() => result.current.mutateAsync(user.id));
  expect(endpoint).toHaveBeenCalledWith(user.id, expect.anything());
  expect(client.getQueryState(userKeys.list)?.isInvalidated).toBe(true);
  client.clear();
});

it("clears cached data when the current account is deactivated", async () => {
  vi.mocked(users.deactivateCurrentUser).mockResolvedValue({ message: "Deactivated" });
  const { client, wrapper } = setup();
  client.setQueryData(userKeys.current, user);
  client.setQueryData(userKeys.list, { users: [user] });
  const { result } = renderHook(() => useDeactivateCurrentUser(), { wrapper });
  await act(() => result.current.mutateAsync());
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});
