import {
  idParamSchema,
  userListSchema,
  userPatchSchema,
  userSchema,
  type UserPatchRequest,
} from "@tracker/shared";
import { request } from "../client";

type MessageResponse = { message: string };

export async function getCurrentUser(signal?: AbortSignal) {
  return userSchema.parse(await request<unknown>("/users/me", { signal }));
}

export async function updateCurrentUser(body: UserPatchRequest) {
  return userSchema.parse(
    await request<unknown>("/users/me", {
      method: "PATCH",
      body: userPatchSchema.parse(body),
    }),
  );
}

export function deactivateCurrentUser() {
  return request<MessageResponse>("/users/me", { method: "DELETE" });
}

export async function getUsers(signal?: AbortSignal) {
  return userListSchema.parse(await request<unknown>("/users", { signal }));
}

export function deleteUser(id: string) {
  const params = idParamSchema.parse({ id });
  return request<MessageResponse>(`/users/${params.id}`, { method: "DELETE" });
}

export function activateUser(id: string) {
  const params = idParamSchema.parse({ id });
  return request<MessageResponse>(`/users/${params.id}/activate`, { method: "POST" });
}

export function deactivateUser(id: string) {
  const params = idParamSchema.parse({ id });
  return request<MessageResponse>(`/users/${params.id}/deactivate`, { method: "POST" });
}
