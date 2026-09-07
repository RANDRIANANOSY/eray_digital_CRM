import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import type { NotificationListFilters } from "@/lib/api/types";
import { isAuthenticated } from "@/lib/api/auth-storage";

export const notificationsKeys = {
  list: (filters: NotificationListFilters = {}) => ["notifications", filters] as const,
  unreadCount: ["notifications", "unreadCount"] as const,
};

export function useNotifications(filters: NotificationListFilters = {}) {
  return useQuery({
    queryKey: notificationsKeys.list(filters),
    queryFn: () => notificationsApi.list(filters),
    enabled: isAuthenticated(),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationsKeys.unreadCount,
    queryFn: notificationsApi.unreadCount,
    enabled: isAuthenticated(),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
