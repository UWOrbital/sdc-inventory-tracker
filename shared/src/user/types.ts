import z from "zod";
import { roleSchema, userPatchSchema } from "./schemas";

export type UserRole = z.infer<typeof roleSchema>;
export type UserPatchBody = z.output<typeof userPatchSchema>
