import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoicesApi } from "@/lib/api";
import type { InvoiceListFilters, InvoicePayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const invoicesKeys = {
  list: (filters: InvoiceListFilters) => ["invoices", filters] as const,
  detail: (id: number) => ["invoices", id] as const,
};

export function useInvoices(filters: InvoiceListFilters = {}) {
  return useQuery({
    queryKey: invoicesKeys.list(filters),
    queryFn: () => invoicesApi.list(filters),
    enabled: isAuthenticated(),
    placeholderData: keepPreviousData,
  });
}

export function useInvoice(id: number | undefined) {
  return useQuery({
    queryKey: invoicesKeys.detail(id ?? 0),
    queryFn: () => invoicesApi.get(id as number),
    enabled: isAuthenticated() && id !== undefined,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoicePayload) => invoicesApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: InvoicePayload }) =>
      invoicesApi.update(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: invoicesKeys.detail(data.id) });
      }
    },
  });
}

export function useInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      invoicesApi.changeStatus(id, status),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: invoicesKeys.detail(data.id) });
      }
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => invoicesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invoices"] }),
  });
}

export function useCreateInvoiceFromOpportunity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (opportunityId: number) => invoicesApi.fromOpportunity(opportunityId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      if (data?.id) {
        queryClient.invalidateQueries({ queryKey: invoicesKeys.detail(data.id) });
      }
    },
  });
}
