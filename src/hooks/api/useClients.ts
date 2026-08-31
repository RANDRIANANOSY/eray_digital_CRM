import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { clientsApi } from "@/lib/api";
import type { ClientListFilters, ClientPayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const clientsKeys = {
  list: (filters: ClientListFilters) => ["clients", filters] as const,
  detail: (id: number) => ["clients", id] as const,
};

export function useClients(filters: ClientListFilters = {}) {
  return useQuery({
    queryKey: clientsKeys.list(filters),
    queryFn: () => clientsApi.list(filters),
    enabled: isAuthenticated(),
    placeholderData: keepPreviousData,
  });
}

export function useClient(id: number | undefined) {
  return useQuery({
    queryKey: clientsKeys.detail(id ?? 0),
    queryFn: () => clientsApi.get(id as number),
    enabled: isAuthenticated() && id !== undefined,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => clientsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientPayload }) =>
      clientsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => clientsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
  });
}
