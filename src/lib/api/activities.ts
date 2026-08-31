import { buildQuery, http } from "./http";
import type { ActivityDto, ActivityListFilters, ActivityPayload, Paginated } from "./types";

export const activitiesApi = {
  list: (filters: ActivityListFilters = {}) =>
    http.get<Paginated<ActivityDto>>(`/api/activities${buildQuery(filters)}`),
  get: (id: number) => http.get<ActivityDto>(`/api/activities/${id}`),
  create: (payload: ActivityPayload) => http.post<ActivityDto>("/api/activities", payload),
  update: (id: number, payload: ActivityPayload) =>
    http.put<ActivityDto>(`/api/activities/${id}`, payload),
  remove: (id: number) => http.delete<null>(`/api/activities/${id}`),
};
