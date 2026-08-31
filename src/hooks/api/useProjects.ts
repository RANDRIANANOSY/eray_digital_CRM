import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/lib/api";
import type { ProjectListFilters, ProjectPayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const projectsKeys = {
  list: (filters: ProjectListFilters) => ["projects", filters] as const,
  detail: (id: number) => ["projects", id] as const,
};

export function useProjects(filters: ProjectListFilters = {}) {
  return useQuery({
    queryKey: projectsKeys.list(filters),
    queryFn: () => projectsApi.list(filters),
    enabled: isAuthenticated(),
    placeholderData: keepPreviousData,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectPayload) => projectsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectPayload }) =>
      projectsApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}
