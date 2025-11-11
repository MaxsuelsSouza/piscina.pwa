/**
 * Estado de erro da página
 */

interface ErrorStateProps {
  error?: string | null;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 flex items-center justify-center px-4">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-white mb-2">Cliente não encontrado</h1>
        <p className="text-white/80 mb-4">
          {error || 'Este link de agendamento não é válido ou foi desativado.'}
        </p>
      </div>
    </div>
  );
}
