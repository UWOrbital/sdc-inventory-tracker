import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import { ApiError } from "../api/client";
import { getCurrentUser } from "../api/endpoints/users";
import { userKeys } from "../hooks/useUsers";
import { useAuth } from "./AuthContext";
import { AuthProvider } from "./AuthProvider";
import { RequireAuth } from "./RequireAuth";

vi.mock("../api/endpoints/users", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../api/endpoints/users")>()),
  getCurrentUser: vi.fn(),
}));

afterEach(() => {
  vi.resetAllMocks();
});

const user = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  email: "test@example.com",
  name: "Test User",
  role: "member" as const,
  createdAt: new Date("2026-01-01T00:00:00Z"),
};

function Consumer() {
  const auth = useAuth();
  return (
    <>
      <span data-testid="state">{auth.status}</span>
      <span>{auth.user?.name}</span>
      <RequireAuth>
        <p>Protected content</p>
      </RequireAuth>
    </>
  );
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <Consumer />
      </AuthProvider>
    </QueryClientProvider>,
  );
  return client;
}

it("checks the session on mount and hides protected content while loading", async () => {
  let resolve!: (value: typeof user) => void;
  vi.mocked(getCurrentUser).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const client = setup();
  expect(screen.getByTestId("state").textContent).toBe("loading");
  expect(screen.queryByText("Protected content")).toBeNull();
  await act(async () => {
    resolve(user);
  });
  await screen.findByText("Protected content");
  expect(screen.getByText("Test User")).toBeTruthy();
  expect(getCurrentUser).toHaveBeenCalledTimes(1);
  client.clear();
});

it.each([
  [new ApiError("Unauthorized", 401), "unauthenticated"],
  [new ApiError("Deactivated", 403), "forbidden"],
  [new ApiError("Server error", 500), "error"],
  [new TypeError("Network unavailable"), "error"],
])("handles %s without displaying protected content", async (error, status) => {
  vi.mocked(getCurrentUser).mockRejectedValue(error);
  const client = setup();
  await waitFor(() => expect(screen.getByTestId("state").textContent).toBe(status));
  expect(screen.queryByText("Protected content")).toBeNull();
  client.clear();
});

it("lets the user retry a failed session check", async () => {
  vi.mocked(getCurrentUser).mockRejectedValueOnce(new TypeError("Offline")).mockResolvedValue(user);
  const client = setup();
  await userEvent.setup().click(await screen.findByRole("button", { name: "Try again" }));
  await screen.findByText("Protected content");
  client.clear();
});

it("reflects cached profile changes and removes access after a session expires", async () => {
  vi.mocked(getCurrentUser).mockResolvedValue(user);
  const client = setup();
  await screen.findByText("Test User");
  act(() => {
    client.setQueryData(userKeys.current, { ...user, name: "Updated User" });
  });
  await screen.findByText("Updated User");
  vi.mocked(getCurrentUser).mockRejectedValue(new ApiError("Unauthorized", 401));
  await act(async () => {
    await client.invalidateQueries({ queryKey: userKeys.current });
  });
  await waitFor(() => expect(screen.getByTestId("state").textContent).toBe("unauthenticated"));
  expect(screen.queryByText("Protected content")).toBeNull();
  expect(screen.queryByText("Updated User")).toBeNull();
  client.clear();
});
