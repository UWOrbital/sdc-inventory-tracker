import type { ReactNode } from "react";
import { ApiError } from "../api/client";
import { useCurrentUser } from "../hooks/useUsers";
import { AuthContext, type AuthState } from "./AuthContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const query = useCurrentUser();
  let state: AuthState;

  if (query.isPending) {
    state = { status: "loading", user: null, error: null };
  } else if (query.isError) {
    if (query.error instanceof ApiError && query.error.status === 401) {
      state = { status: "unauthenticated", user: null, error: null };
    } else {
      state = {
        status:
          query.error instanceof ApiError && query.error.status === 403 ? "forbidden" : "error",
        user: null,
        error: query.error,
      };
    }
  } else {
    state = { status: "authenticated", user: query.data, error: null };
  }

  async function refresh() {
    await query.refetch();
  }

  return <AuthContext.Provider value={{ ...state, refresh }}>{children}</AuthContext.Provider>;
}
