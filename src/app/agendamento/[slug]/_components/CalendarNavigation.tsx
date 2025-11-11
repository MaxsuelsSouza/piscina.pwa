/**
 * Navegação do calendário com mês/ano
 */

interface CalendarNavigationProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

export function CalendarNavigation({
  currentDate,
  onPrevMonth,
  onNextMonth,
}: CalendarNavigationProps) {
  return (
    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
      <button
        onClick={onPrevMonth}
        className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900"
        aria-label="Mês anterior"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <h3 className="text-lg font-light text-gray-900 capitalize">
        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
      </h3>
      <button
        onClick={onNextMonth}
        className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900"
        aria-label="Próximo mês"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
