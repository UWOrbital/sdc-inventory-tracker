import type { ReactNode } from "react";
import { useAuth } from "./AuthContext";

export function RequireAuth({
  children,
  fallback = <p>Please sign in to continue.</p>,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const auth = useAuth();

  if (auth.status === "loading") return <p role="status">Checking your session…</p>;
  if (auth.status === "unauthenticated") return <>{fallback}</>;
  if (auth.status === "forbidden") return <p role="alert">Access to this account is denied.</p>;
  if (auth.status === "error") {
    return (
      <div role="alert">
        <p>Unable to check your session.</p>
        <button type="button" onClick={() => void auth.refresh()}>
          Try again
        </button>
      </div>
    );
  }
  return <>{children}</>;
}
