import { DrizzleQueryError } from "drizzle-orm";
import { DatabaseError } from "pg";
import { PostgresError } from "pg-error-enum";

export function isUniqueViolation(err: unknown) {
  return (
    err instanceof DrizzleQueryError &&
    err.cause instanceof DatabaseError &&
    err.cause.code === PostgresError.UNIQUE_VIOLATION
  );
}
