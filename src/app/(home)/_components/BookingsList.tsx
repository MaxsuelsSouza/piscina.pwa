/**
 * Lista de agendamentos do dia
 */

"use client";

import { cn } from '@/lib/utils';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useToast } from '@/hooks/useToast';
import type { Booking } from '../_types/booking';

interface BookingsListProps {
  date: string;
  bookings: Booking[];
  onCancelBooking?: (id: string) => void;
}

const TIME_SLOT_LABELS = {
  morning: 'Manhã (08:00 - 12:00)',
  afternoon: 'Tarde (13:00 - 17:00)',
  evening: 'Noite (18:00 - 22:00)',
  'full-day': 'Dia Inteiro (08:00 - 22:00)',
};

const STATUS_LABELS = {
  pending: 'Pendente',
  confirmed: 'Confirmado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function BookingsList({ date, bookings, onCancelBooking }: BookingsListProps) {
  const { confirm } = useConfirm();
  const toast = useToast();

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr + 'T00:00:00');
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Agendamentos
        </h3>
        <p className="text-sm text-gray-600 mb-6 capitalize">
          {formatDate(date)}
        </p>
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
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
          <p className="text-gray-600">Nenhum agendamento para esta data</p>
          <p className="text-sm text-gray-500 mt-1">Clique em &quot;Novo Agendamento&quot; para criar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Agendamentos ({bookings.length})
      </h3>
      <p className="text-sm text-gray-600 mb-6 capitalize">
        {formatDate(date)}
      </p>

      <div className="space-y-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="font-semibold text-gray-900">{booking.customerName}</h4>
                <p className="text-sm text-gray-600">{TIME_SLOT_LABELS[booking.timeSlot]}</p>
              </div>
              <span
                className={cn(
                  'px-2 py-1 rounded text-xs font-medium border',
                  STATUS_COLORS[booking.status]
                )}
              >
                {STATUS_LABELS[booking.status]}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>{booking.customerPhone}</span>
              </div>

              {booking.customerEmail && (
                <div className="flex items-center gap-2 text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>{booking.customerEmail}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-gray-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <span>{booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'pessoa' : 'pessoas'}</span>
              </div>

              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Observações:</p>
                  <p className="text-gray-700">{booking.notes}</p>
                </div>
              )}
            </div>

            {booking.status !== 'cancelled' && onCancelBooking && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={async () => {
                    const confirmed = await confirm({
                      title: 'Cancelar Agendamento',
                      message: 'Tem certeza que deseja cancelar este agendamento?',
                      confirmText: 'Sim, cancelar',
                      cancelText: 'Não',
                      variant: 'danger',
                    });

                    if (confirmed) {
                      try {
                        onCancelBooking(booking.id);
                        toast.success('Agendamento cancelado com sucesso!');
                      } catch (error) {
                        toast.error('Não foi possível cancelar o agendamento. Tente novamente.');
                      }
                    }
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Cancelar agendamento
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
