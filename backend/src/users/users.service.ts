import { eq } from "drizzle-orm";

import { Database } from "@/platform/database/pool";
import { user } from "@/users/users.schema";

export type User = typeof user.$inferSelect;
export type PublicUser = Omit<User, "passwordHash">;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toPublicUser({ passwordHash: _, ...rest }: User): PublicUser {
  return rest;
}

export async function findUserByEmail(db: Database, email: string) {
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizeEmail(email)));
  return found;
}

export async function findUserById(db: Database, id: string) {
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
    .values({ ...values, email: normalizeEmail(values.email) })
    .onConflictDoNothing({ target: user.email })
    .returning();
  return created;
}
