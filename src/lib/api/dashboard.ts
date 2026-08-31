import { http } from "./http";
import type { DashboardStatistics } from "./types";

export const dashboardApi = {
  statistics: () => http.get<DashboardStatistics>("/api/dashboard/statistics"),
};
