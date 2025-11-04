/**
 * Dashboard Feature Types
 * TypeScript types specific to dashboard
 */

export type DashboardData = {
  stats: {
    totalBalance: number;
    totalIncome: number;
    totalExpenses: number;
    monthlyChange: number;
  };
  recentTransactions: Transaction[];
  chartData: ChartDataPoint[];
};

export type Transaction = {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: Date;
};

export type ChartDataPoint = {
  date: string;
  income: number;
  expense: number;
};
