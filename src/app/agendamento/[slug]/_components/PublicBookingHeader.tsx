/**
 * Cabeçalho da página pública de agendamento
 */

interface PublicBookingHeaderProps {
  clientName?: string;
}

export function PublicBookingHeader({ clientName }: PublicBookingHeaderProps) {
  return (
    <div className="bg-gradient-to-br from-blue-900 to-blue-800 pt-12 pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-light text-white mb-2 tracking-tight">
            Agendar com {clientName || 'Cliente'}
          </h1>
          <p className="text-blue-200 text-sm font-light">
            Selecione uma data disponível para fazer seu agendamento
          </p>
        </div>
      </div>
    </div>
  );
}
