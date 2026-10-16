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

// Responses (JSON wire format, so dates are ISO strings)

export const publicUserSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
  role: userRoleSchema,
  createdAt: z.iso.datetime({ offset: true }),
});

export const authResponseSchema = z.object({
  user: publicUserSchema,
});

export type PublicUserResponse = z.infer<typeof publicUserSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
