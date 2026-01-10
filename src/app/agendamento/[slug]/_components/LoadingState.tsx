/**
 * Estado de loading da página
 */

export function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-800 dark:from-gray-900 dark:to-black flex items-center justify-center">
      <div className="text-white dark:text-gray-200 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white dark:border-gray-300 mx-auto mb-4"></div>
        <p>Carregando...</p>
      </div>
    </div>
  );
}
