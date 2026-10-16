import z from "zod";

import { registerSchema } from "./schemas";

export type RegisterBody = z.output<typeof registerSchema>
