/**
 * Estado de erro da página de explorar
 */

interface ErrorStateProps {
  error?: string | null;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <p className="text-gray-900 mb-2">Erro ao carregar espaços</p>
        <p className="text-sm text-gray-600 mb-4">
          {error || 'Não foi possível carregar os espaços'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-gray-900 hover:text-gray-600 underline"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
