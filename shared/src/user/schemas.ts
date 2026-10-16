import { z } from "zod";

export const USER_ROLES = ["member", "admin", "superuser"] as const;

export const roleSchema = z.enum(USER_ROLES);

const isoDatetime = z.codec(z.iso.datetime({ offset: true }), z.date(), {
  decode: (iso) => new Date(iso),
  encode: (date) => date.toISOString(),
});

export const userSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().optional(),
  role: roleSchema,
  createdAt: isoDatetime,
});

export const userPatchSchema = userSchema.pick({
  email: true,
  name: true,
}).partial();

export const userListSchema = z.object({
  users: z.array(userSchema)
})
