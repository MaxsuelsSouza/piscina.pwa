/**
 * Estado de carregamento da página de explorar
 */

export function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-4" />
        <p className="text-sm text-gray-600">Carregando...</p>
      </div>
    </div>
  );
}
