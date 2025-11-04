/**
 * Dashboard Layout
 * Layout para páginas protegidas do dashboard
 */

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header/Navigation will be added here */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
