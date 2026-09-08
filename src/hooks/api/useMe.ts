import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { meApi } from "@/lib/api";
import type { MeUpdatePayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const meKeys = { me: ["me"] as const };

export function useMe() {
  return useQuery({
    queryKey: meKeys.me,
    queryFn: meApi.get,
    enabled: isAuthenticated(),
    staleTime: 60_000,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: MeUpdatePayload) => meApi.update(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.me });
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => meApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.me });
    },
  });
}

export function useRemoveAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => meApi.removeAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meKeys.me });
    },
  });
}
