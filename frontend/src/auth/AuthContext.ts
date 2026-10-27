import { createContext, useContext } from "react";
import type { getCurrentUser } from "../api/endpoints/users";

type User = Awaited<ReturnType<typeof getCurrentUser>>;

export type AuthState =
  | { status: "loading"; user: null; error: null }
  | { status: "authenticated"; user: User; error: null }
  | { status: "unauthenticated"; user: null; error: null }
  | { status: "forbidden" | "error"; user: null; error: Error };

export const AuthContext = createContext<
  (AuthState & { refresh: () => Promise<void> }) | undefined
>(undefined);

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used within AuthProvider");
  return auth;
}
