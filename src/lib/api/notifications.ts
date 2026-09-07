import { buildQuery, http } from "./http";
import type { NotificationDto, NotificationListFilters, Paginated } from "./types";

export const notificationsApi = {
  list: (filters: NotificationListFilters = {}) =>
    http.get<Paginated<NotificationDto>>(`/api/notifications${buildQuery(filters)}`),
  unreadCount: () => http.get<{ count: number }>("/api/notifications/unread-count"),
  markRead: (id: number) => http.patch<NotificationDto>(`/api/notifications/${id}/read`),
  markAllRead: () => http.patch<{ count: number }>("/api/notifications/read-all"),
};
