import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateUser,
  deactivateCurrentUser,
  deactivateUser,
  deleteUser,
  getCurrentUser,
  getUsers,
  updateCurrentUser,
} from "../api/endpoints/users";

export const userKeys = {
  all: ["users"] as const,
  current: ["users", "me"] as const,
  list: ["users", "list"] as const,
};

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.current,
    queryFn: ({ signal }) => getCurrentUser(signal),
    retry: false,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: userKeys.list,
    queryFn: ({ signal }) => getUsers(signal),
  });
}

export function useUpdateCurrentUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: updateCurrentUser,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeactivateCurrentUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deactivateCurrentUser,
    onSuccess: async () => {
      await client.cancelQueries();
      client.clear();
    },
  });
}

export function useDeleteUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useActivateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: activateUser,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

export function useDeactivateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: deactivateUser,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
