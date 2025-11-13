/**
 * Componente de estatísticas do painel administrativo
 */

'use client';

interface AdminStatsProps {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  monthlyRevenue: number;
}

export function AdminStats({
  totalBookings,
  confirmedBookings,
  pendingBookings,
  monthlyRevenue
}: AdminStatsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-50 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total
          </h3>
        </div>
        <p className="text-xl sm:text-3xl font-light text-gray-900">{totalBookings}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 font-light">Este mês</p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-50 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
            Confirmados
          </h3>
        </div>
        <p className="text-xl sm:text-3xl font-light text-green-600">{confirmedBookings}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 font-light">Agendamentos ativos</p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-yellow-50 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pendentes
          </h3>
        </div>
        <p className="text-xl sm:text-3xl font-light text-yellow-600">{pendingBookings}</p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 font-light">Aguardando confirmação</p>
      </div>

      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-6 border border-gray-100">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-50 flex items-center justify-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">
            Receita
          </h3>
        </div>
        <p className="text-lg sm:text-3xl font-light text-purple-600 whitespace-nowrap overflow-hidden text-ellipsis">
          R$ {monthlyRevenue.toLocaleString('pt-BR')}
        </p>
        <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 font-light">Confirmados × R$ 400</p>
      </div>
    </div>
  );
}
