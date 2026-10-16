import { z } from "zod";

import { roleSchema, userListSchema, userPatchSchema, userSchema } from "./schemas";

export type UserRole = z.infer<typeof roleSchema>;

export type UserPatchRequest = z.input<typeof userPatchSchema>;
export type UserPatchBody = z.output<typeof userPatchSchema>;

export type UserResponse = z.input<typeof userSchema>;
export type UserListResponse = z.input<typeof userListSchema>;
