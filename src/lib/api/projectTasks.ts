import { http } from "./http";
import type { ProjectTaskDto, ProjectTaskPayload } from "./types";

export const projectTasksApi = {
  list: (projectId: number) => http.get<ProjectTaskDto[]>(`/api/projects/${projectId}/tasks`),
  create: (projectId: number, payload: ProjectTaskPayload) =>
    http.post<ProjectTaskDto>(`/api/projects/${projectId}/tasks`, payload),
  update: (projectId: number, id: number, payload: ProjectTaskPayload) =>
    http.put<ProjectTaskDto>(`/api/projects/${projectId}/tasks/${id}`, payload),
  remove: (projectId: number, id: number) =>
    http.delete<null>(`/api/projects/${projectId}/tasks/${id}`),
};
