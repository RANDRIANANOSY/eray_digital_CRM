import { buildQuery, http } from "./http";
import type { ClientDto, ClientListFilters, ClientPayload, Paginated } from "./types";

export const clientsApi = {
  list: (filters: ClientListFilters = {}) =>
    http.get<Paginated<ClientDto>>(`/api/clients${buildQuery(filters)}`),
  get: (id: number) => http.get<ClientDto>(`/api/clients/${id}`),
  create: (payload: ClientPayload) => http.post<ClientDto>("/api/clients", payload),
  update: (id: number, payload: ClientPayload) =>
    http.put<ClientDto>(`/api/clients/${id}`, payload),
  remove: (id: number) => http.delete<null>(`/api/clients/${id}`),
};
