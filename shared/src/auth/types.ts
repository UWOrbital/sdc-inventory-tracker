import { z } from "zod";

import { loginSchema, registerSchema } from "./schemas";

// z.input is what the client sends; z.output is what the server sees after parsing.
export type RegisterRequest = z.input<typeof registerSchema>;
export type RegisterBody = z.output<typeof registerSchema>;
export type LoginRequest = z.input<typeof loginSchema>;
