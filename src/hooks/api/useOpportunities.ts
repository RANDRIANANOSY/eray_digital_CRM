import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { opportunitiesApi } from "@/lib/api";
import type { OpportunityListFilters, OpportunityPayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const opportunitiesKeys = {
  list: (filters: OpportunityListFilters) => ["opportunities", filters] as const,
  detail: (id: number) => ["opportunities", id] as const,
};

export function useOpportunities(filters: OpportunityListFilters = {}) {
  return useQuery({
    queryKey: opportunitiesKeys.list(filters),
    queryFn: () => opportunitiesApi.list(filters),
    enabled: isAuthenticated(),
    placeholderData: keepPreviousData,
  });
}

export function useCreateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: OpportunityPayload) => opportunitiesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}

export function useUpdateOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: OpportunityPayload }) =>
      opportunitiesApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}

export function useDeleteOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => opportunitiesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["opportunities"] }),
  });
}
