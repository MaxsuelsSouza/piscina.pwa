/**
 * Visualização diária de agendamentos para barbearias
 * Mostra todos os horários do dia com os agendamentos
 */

'use client';

import { useMemo } from 'react';
import type { ServiceBooking } from '@/types/barbershop';

interface BarbershopDailyViewProps {
  selectedDate: Date;
  bookings: ServiceBooking[];
  onBookingClick: (booking: ServiceBooking) => void;
  onDateChange: (date: Date) => void;
}

export function BarbershopDailyView({
  selectedDate,
  bookings,
  onBookingClick,
  onDateChange,
}: BarbershopDailyViewProps) {
  // Formata a data selecionada para YYYY-MM-DD
  const dateStr = useMemo(() => {
    return selectedDate.toISOString().split('T')[0];
  }, [selectedDate]);

  // Filtra agendamentos do dia selecionado
  const dayBookings = useMemo(() => {
    return bookings
      .filter(booking => booking.date === dateStr && booking.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [bookings, dateStr]);

  // Agrupa por profissional
  const bookingsByProfessional = useMemo(() => {
    const map = new Map<string, ServiceBooking[]>();

    dayBookings.forEach(booking => {
      const existing = map.get(booking.professionalId) || [];
      map.set(booking.professionalId, [...existing, booking]);
    });

    return map;
  }, [dayBookings]);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação de data */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Dia anterior"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {selectedDate.toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {dayBookings.length} agendamento(s)
              </p>
            </div>

            <button
              onClick={handleNextDay}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Próximo dia"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Lista de agendamentos */}
      {dayBookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-300 font-medium">Nenhum agendamento para este dia</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Selecione outro dia ou aguarde novos agendamentos</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Agrupado por profissional */}
          {Array.from(bookingsByProfessional.entries()).map(([professionalId, profBookings]) => (
            <div
              key={professionalId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Header do profissional */}
              <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {profBookings[0]?.professionalName || 'Profissional'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {profBookings.length} agendamento(s)
                </p>
              </div>

              {/* Lista de agendamentos do profissional */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {profBookings.map(booking => (
                  <button
                    key={booking.id}
                    onClick={() => onBookingClick(booking)}
                    className="w-full px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                              {booking.startTime} - {booking.endTime}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({booking.totalDuration} min)
                          </span>
                        </div>

                        <p className="text-gray-900 dark:text-gray-100 font-medium mb-1">
                          {booking.customerName}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <span>{booking.customerPhone}</span>
                          {booking.customerEmail && (
                            <>
                              <span className="text-gray-300 dark:text-gray-600">•</span>
                              <span>{booking.customerEmail}</span>
                            </>
                          )}
                        </div>

                        {/* Serviços */}
                        <div className="mt-2 flex flex-wrap gap-2">
                          {booking.services.map((service, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                            >
                              {service.serviceName} ({service.duration}min)
                            </span>
                          ))}
                        </div>

                        {booking.notes && (
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                            "{booking.notes}"
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          R$ {booking.totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
