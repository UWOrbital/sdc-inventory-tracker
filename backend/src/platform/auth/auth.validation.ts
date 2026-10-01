import z from "zod";

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

export type RegisterBody = z.output<typeof registerSchema>;
