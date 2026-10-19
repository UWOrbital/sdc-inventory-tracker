import { DrizzleQueryError, eq } from "drizzle-orm";

import { UserPatchBody } from "@tracker/shared";

import { Database } from "@/platform/database/pool";
import { user } from "@/users/users.schema";

const UNIQUE_VIOLATION = "23505";

// Drizzle wraps driver errors, so the pg error code lives on `cause`.
function isUniqueViolation(err: unknown) {
  return (
    err instanceof DrizzleQueryError &&
    (err.cause as { code?: string } | undefined)?.code === UNIQUE_VIOLATION
  );
}

export async function getUserList(db: Database) {
  return await db.select().from(user).orderBy(user.createdAt);
}

export async function getUserByEmail(db: Database, email: string) {
  const [found] = await db.select().from(user).where(eq(user.email, email));
  return found;
}

export async function getUserById(db: Database, id: string) {
  const [found] = await db.select().from(user).where(eq(user.id, id));
  return found;
}

// Returns undefined when the email is already taken.
export async function createUser(
  db: Database,
  values: { email: string; passwordHash: string; name?: string },
) {
  const [created] = await db
    .insert(user)
    .values(values)
    .onConflictDoNothing({ target: user.email })
    .returning();
  return created;
}

// Returns null when the email is already taken, undefined when the user doesn't exist.
export async function updateUserById(db: Database, id: string, values: UserPatchBody) {
  if (Object.keys(values).length === 0) return getUserById(db, id);

  try {
    const [updated] = await db.update(user).set(values).where(eq(user.id, id)).returning();
    return updated;
  } catch (err) {
    if (isUniqueViolation(err)) return null;
    throw err;
  }
}

// Each returns whether a user with the id existed.

export async function updateUserActive(db: Database, id: string, active: boolean) {
  const updated = await db
    .update(user)
    .set({ active })
    .where(eq(user.id, id))
    .returning({ id: user.id });
  return updated.length > 0;
}

export async function deleteUserById(db: Database, id: string) {
  const deleted = await db.delete(user).where(eq(user.id, id)).returning({ id: user.id });
  return deleted.length > 0;
}
