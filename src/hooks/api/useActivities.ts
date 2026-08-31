import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { activitiesApi } from "@/lib/api";
import type { ActivityListFilters, ActivityPayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const activitiesKeys = {
  list: (filters: ActivityListFilters) => ["activities", filters] as const,
  detail: (id: number) => ["activities", id] as const,
};

export function useActivities(filters: ActivityListFilters = {}) {
  return useQuery({
    queryKey: activitiesKeys.list(filters),
    queryFn: () => activitiesApi.list(filters),
    enabled: isAuthenticated(),
    placeholderData: keepPreviousData,
  });
}

export function useCreateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ActivityPayload) => activitiesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useUpdateActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ActivityPayload }) =>
      activitiesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => activitiesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
  });
}
