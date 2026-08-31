import { buildQuery, http } from "./http";
import type {
  OpportunityDto,
  OpportunityListFilters,
  OpportunityPayload,
  Paginated,
} from "./types";

export const opportunitiesApi = {
  list: (filters: OpportunityListFilters = {}) =>
    http.get<Paginated<OpportunityDto>>(`/api/opportunities${buildQuery(filters)}`),
  get: (id: number) => http.get<OpportunityDto>(`/api/opportunities/${id}`),
  create: (payload: OpportunityPayload) => http.post<OpportunityDto>("/api/opportunities", payload),
  update: (id: number, payload: OpportunityPayload) =>
    http.put<OpportunityDto>(`/api/opportunities/${id}`, payload),
  remove: (id: number) => http.delete<null>(`/api/opportunities/${id}`),
};
