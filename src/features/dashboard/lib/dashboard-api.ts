/**
 * Dashboard API Client
 * API calls specific to dashboard feature
 */

import { apiClient } from "@/lib/api-client";
import type { DashboardData } from "../types";

export const dashboardApi = {
  getData: () => apiClient.get<DashboardData>("/api/dashboard"),

  getStats: () => apiClient.get("/api/dashboard/stats"),

  getRecentTransactions: (limit: number = 10) =>
    apiClient.get("/api/dashboard/transactions", { params: { limit: limit.toString() } }),
};
