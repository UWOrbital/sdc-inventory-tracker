import { eq } from "drizzle-orm";

import { RegisterBody, UserPatchBody } from "@tracker/shared";

import { Database } from "@/platform/database/pool";
import { user } from "@/users/users.schema";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getUserList(db: Database) {
  return await db.select().from(user);
}

export async function getUserByEmail(db: Database, email: string) {
  const [found] = await db
    .select()
    .from(user)
    .where(eq(user.email, normalizeEmail(email)));
  return found;
}

export async function getUserById(db: Database, id: string) {
  const [found] = await db.select().from(user).where(eq(user.id, id));
  return found;
}

// Returns undefined when the email is already taken.
export async function createUser(db: Database, values: RegisterBody) {
  const [created] = await db
    .insert(user)
    .values({ ...values, email: normalizeEmail(values.email) })
    .onConflictDoNothing({ target: user.email })
    .returning();
  return created;
}

export async function updateUserById(db: Database, id: string, values: UserPatchBody) {
  const [updated] = await db.update(user).set(values).where(eq(user.id, id)).returning();
  return updated;
}

export async function updateUserActive(db: Database, id: string, active: boolean) {
  await db.update(user).set({ active }).where(eq(user.id, id));
}

export async function deleteUserById(db: Database, id: string) {
  await db.delete(user).where(eq(user.id, id));
}
