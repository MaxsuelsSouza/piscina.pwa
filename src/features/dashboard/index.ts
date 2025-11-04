/**
 * Dashboard Feature - Barrel Export
 * Public API da feature de dashboard
 */

// Hooks
export { useDashboard } from "./hooks/use-dashboard";

// Types
export type { DashboardData, Transaction, ChartDataPoint } from "./types";

// API
export { dashboardApi } from "./lib/dashboard-api";
