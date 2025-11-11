/**
 * Cabeçalho da página de explorar espaços
 */

export function ExploreHeader() {
  return (
    <div className="bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              Explorar Espaços
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Encontre o local perfeito para seu evento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
