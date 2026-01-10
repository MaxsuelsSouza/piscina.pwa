/**
 * Dashboard para visualização dos barbeiros
 * Mostra apenas os agendamentos do barbeiro logado
 */

'use client';

import { useState, useMemo } from 'react';
import { useBarberBookings } from '../_hooks/useBarberBookings';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Booking } from '@/app/(home)/_types/booking';

const TIME_SLOTS = {
  morning: { label: 'Manhã', time: '08:00 - 12:00' },
  afternoon: { label: 'Tarde', time: '13:00 - 17:00' },
  evening: { label: 'Noite', time: '18:00 - 22:00' },
  'full-day': { label: 'Dia Todo', time: '08:00 - 22:00' },
};

const STATUS_LABELS = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  confirmed: { label: 'Confirmado', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export function BarberDashboard() {
  const { bookings, loading, updateBookingStatus } = useBarberBookings();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Filtra agendamentos por data selecionada
  const filteredBookings = useMemo(() => {
    if (!selectedDate) {
      // Mostra todos os agendamentos futuros
      const today = format(new Date(), 'yyyy-MM-dd');
      return bookings.filter((booking) => booking.date >= today);
    }
    return bookings.filter((booking) => booking.date === selectedDate);
  }, [bookings, selectedDate]);

  // Agrupa por data
  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    filteredBookings.forEach((booking) => {
      if (!grouped[booking.date]) {
        grouped[booking.date] = [];
      }
      grouped[booking.date].push(booking);
    });
    return grouped;
  }, [filteredBookings]);

  const handleConfirm = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'confirmed');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'cancelled');
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-600 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Meus Agendamentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie seus agendamentos
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Total de Agendamentos
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {filteredBookings.length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Confirmados
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {filteredBookings.filter((b) => b.status === 'confirmed').length}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Pendentes
            </h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {filteredBookings.filter((b) => b.status === 'pending').length}
            </p>
          </div>
        </div>

        {/* Lista de Agendamentos por Data */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Próximos Agendamentos
            </h2>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum agendamento encontrado
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {Object.entries(bookingsByDate)
                .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                .map(([date, dayBookings]) => (
                  <div key={date} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {format(new Date(date + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </h3>

                    <div className="space-y-3">
                      {dayBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 text-xs font-medium rounded-full ${STATUS_LABELS[booking.status].color}`}>
                                {STATUS_LABELS[booking.status].label}
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                {TIME_SLOTS[booking.timeSlot].label} - {TIME_SLOTS[booking.timeSlot].time}
                              </span>
                            </div>

                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                              {booking.customerName}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                              📞 {booking.customerPhone}
                            </p>
                            {booking.customerEmail && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                ✉️ {booking.customerEmail}
                              </p>
                            )}
                            {booking.notes && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                💬 {booking.notes}
                              </p>
                            )}
                          </div>

                          {/* Ações */}
                          {booking.status === 'pending' && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleConfirm(booking.id)}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Confirmar
                              </button>
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}

                          {booking.status === 'confirmed' && (
                            <div className="flex gap-2 ml-4">
                              <button
                                onClick={() => handleCancel(booking.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
