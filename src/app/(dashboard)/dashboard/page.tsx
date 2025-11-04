import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visão geral financeira",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* Dashboard components will be added here */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Dashboard components serão implementados em src/features/dashboard/components
          </p>
        </div>
      </div>
    </div>
  );
}
