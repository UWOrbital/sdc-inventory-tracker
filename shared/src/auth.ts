import { z } from "zod";
import { userRoleSchema } from "./roles";

// Request bodies

export const registerSchema = z.object({
  email: z.email().max(254),
  // Upper bound keeps hashing cost bounded for oversized inputs.
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

// z.input is what the client sends; z.output is what the server sees after parsing.
export type RegisterRequest = z.input<typeof registerSchema>;
export type RegisterBody = z.output<typeof registerSchema>;
export type LoginRequest = z.input<typeof loginSchema>;

// Responses. Input is the JSON wire format (ISO date strings); output has real Dates.
// The server builds responses with `schema.encode(...)`, the client reads them with `schema.parse(...)`.

const isoDatetime = z.codec(z.iso.datetime({ offset: true }), z.date(), {
  decode: (iso) => new Date(iso),
  encode: (date) => date.toISOString(),
});

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  createdAt: isoDatetime,
});

export const authResponseSchema = z.object({
  user: publicUserSchema,
});

export type PublicUserResponse = z.input<typeof publicUserSchema>;
export type AuthResponse = z.input<typeof authResponseSchema>;
