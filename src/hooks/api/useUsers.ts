import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import type { UserInvitePayload, UserStatus, UserUpdatePayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const usersKeys = { list: ["users"] as const };

export function useUsers() {
  return useQuery({
    queryKey: usersKeys.list,
    queryFn: usersApi.list,
    enabled: isAuthenticated(),
    staleTime: 30_000,
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserInvitePayload) => usersApi.invite(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.list }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserUpdatePayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.list }),
  });
}

export function useSetUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: UserStatus }) =>
      usersApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKeys.list }),
  });
}
