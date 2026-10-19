import { z } from "zod";

const normalizedEmail = z.string().trim().toLowerCase();

export const registerSchema = z.object({
  email: normalizedEmail.pipe(z.email().max(254)),
  password: z.string().min(8).max(128),
  name: z.string().trim().min(1).max(100).optional(),
});

export const loginSchema = z.object({
  email: normalizedEmail.pipe(z.email().max(254)),
  password: z.string().min(1).max(128),
});
