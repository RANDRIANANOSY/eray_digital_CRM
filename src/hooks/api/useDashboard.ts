import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { isAuthenticated } from "@/lib/api/auth-storage";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-statistics"],
    queryFn: dashboardApi.statistics,
    enabled: isAuthenticated(),
    staleTime: 30_000,
  });
}
