import { buildQuery, http } from "./http";
import type { Paginated, ProjectDto, ProjectListFilters, ProjectPayload } from "./types";

export const projectsApi = {
  list: (filters: ProjectListFilters = {}) =>
    http.get<Paginated<ProjectDto>>(`/api/projects${buildQuery(filters)}`),
  get: (id: number) => http.get<ProjectDto>(`/api/projects/${id}`),
  create: (payload: ProjectPayload) => http.post<ProjectDto>("/api/projects", payload),
  update: (id: number, payload: ProjectPayload) =>
    http.put<ProjectDto>(`/api/projects/${id}`, payload),
  remove: (id: number) => http.delete<null>(`/api/projects/${id}`),
};
