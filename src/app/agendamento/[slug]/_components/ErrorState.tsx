/**
 * Estado de erro da página
 */

interface ErrorStateProps {
  error?: string | null;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 to-red-800 dark:from-red-950 dark:to-red-900 flex items-center justify-center px-4">
      <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center border border-white/10">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-white mb-2">Cliente não encontrado</h1>
        <p className="text-white/80 dark:text-white/70 mb-4">
          {error || 'Este link de agendamento não é válido ou foi desativado.'}
        </p>
      </div>
    </div>
  );
}
