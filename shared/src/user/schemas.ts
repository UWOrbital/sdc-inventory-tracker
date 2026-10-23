import { z } from "zod";

import { registerSchema } from "../auth/schemas";

export const USER_ROLES = ["member", "admin", "superuser"] as const;

export const roleSchema = z.enum(USER_ROLES);

// Responses. Input is the JSON wire format (ISO date strings); output has real Dates.
// The server builds responses with `schema.encode(...)`, the client reads them with `schema.parse(...)`.

const isoDatetime = z.codec(z.iso.datetime({ offset: true }), z.date(), {
  decode: (iso) => new Date(iso),
  encode: (date) => date.toISOString(),
});

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
  role: roleSchema,
  createdAt: isoDatetime,
});

export const userListSchema = z.object({
  users: z.array(userSchema),
});

// Request bodies. Unlisted keys (email, role, active, ...) are stripped, so users can't escalate.

export const userPatchSchema = registerSchema.pick({ name: true }).partial();

export const idParamSchema = z.object({
  id: z.uuid(),
});
