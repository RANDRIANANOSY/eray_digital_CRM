import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { projectTasksApi } from "@/lib/api";
import type { ProjectTaskPayload } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";
import { projectsKeys } from "./useProjects";

export const projectTasksKeys = {
  list: (projectId: number) => ["project-tasks", projectId] as const,
};

export function useProjectTasks(projectId: number | undefined) {
  return useQuery({
    queryKey: projectTasksKeys.list(projectId ?? 0),
    queryFn: () => projectTasksApi.list(projectId as number),
    enabled: isAuthenticated() && projectId !== undefined,
  });
}

export function useCreateProjectTask(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProjectTaskPayload) => projectTasksApi.create(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTasksKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
    },
  });
}

export function useUpdateProjectTask(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectTaskPayload }) =>
      projectTasksApi.update(projectId, id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectTasksKeys.list(projectId) }),
  });
}

export function useDeleteProjectTask(projectId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => projectTasksApi.remove(projectId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectTasksKeys.list(projectId) });
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(projectId) });
    },
  });
}
