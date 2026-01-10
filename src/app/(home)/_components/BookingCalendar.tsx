/**
 * Componente de calendário para visualização de agendamentos
 */

"use client";

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Booking, BlockedDate } from '../_types/booking';

interface BookingCalendarProps {
  currentDate: Date;
  bookings: Booking[];
  selectedDates: string[];
  onSelectDate: (date: string) => void;
  onViewBooking?: (booking: Booking | string) => void;
  multiSelectMode?: boolean;
  blockedDates?: BlockedDate[];
  adminMode?: boolean;
}

export function BookingCalendar({
  currentDate,
  bookings,
  selectedDates,
  onSelectDate,
  onViewBooking,
  multiSelectMode = false,
  blockedDates = [],
  adminMode = false,
}: BookingCalendarProps) {
  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysCount = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Adiciona dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adiciona os dias do mês
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }

    return days;
  }, [currentDate]);

  const getDateString = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getBookingsForDay = (day: number) => {
    const dateStr = getDateString(day);
    // Tanto no modo admin quanto público, não mostra cancelados no calendário
    return bookings.filter(b => b.date === dateStr && b.status !== 'cancelled');
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  const isPast = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return dayDate < today;
  };

  const isBlocked = (day: number) => {
    const dateStr = getDateString(day);
    return blockedDates.some(blocked => blocked.date === dateStr);
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div>
      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-2">
        {/* Dias da semana */}
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 dark:text-gray-300 py-3 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}

        {/* Dias do mês */}
        {daysInMonth.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = getDateString(day);
          const dayBookings = getBookingsForDay(day);
          const isSelected = selectedDates.includes(dateStr);
          const isTodayDate = isToday(day);
          const isPastDate = isPast(day);
          const isBlockedDate = isBlocked(day);
          const isBooked = dayBookings.length > 0; // Dia já tem agendamento (ativos apenas)
          const hasActiveBooking = dayBookings.length > 0;
          const isConfirmed = dayBookings.some(b => b.status === 'confirmed');
          const isPending = dayBookings.some(b => b.status === 'pending');

          // No modo admin, dias passados só são desabilitados se não têm agendamento
          // No modo público, dias ocupados, bloqueados ou passados são desabilitados
          const isDisabled = adminMode
            ? (isPastDate && !isBooked)
            : (isPastDate || isBlockedDate || isBooked);

          const handleDayClick = () => {
            // No modo admin, permitir clicar em dias bloqueados e dias passados com agendamentos
            if (!adminMode && isBlockedDate) return;
            if (isPastDate && !isBooked && !adminMode) return;
            if (isPastDate && !isBooked && adminMode) return;

            // Impede seleção de dias ocupados no modo público
            if (isBooked && !adminMode) return;

            if (isBooked && onViewBooking) {
              // Se tem agendamento, abre o modal de detalhes
              onViewBooking(dayBookings[0]);
            } else if (isBlockedDate && adminMode && onViewBooking) {
              // No modo admin, se está bloqueado, chama onViewBooking com a data
              onViewBooking(dateStr);
            } else {
              // Se não tem agendamento, seleciona o dia
              onSelectDate(dateStr);
            }
          };

          return (
            <button
              key={day}
              onClick={handleDayClick}
              disabled={isDisabled}
              className={cn(
                'aspect-square rounded-xl transition-all relative group',
                'flex flex-col items-center justify-center',
                isSelected && !isBooked && !isBlockedDate && 'bg-blue-600 dark:bg-blue-500 shadow-lg scale-105',
                !isSelected && !isDisabled && !isBooked && 'hover:bg-gray-50 dark:hover:bg-gray-700 hover:scale-105',
                isPastDate && !isBooked && !isBlockedDate && 'cursor-not-allowed opacity-30',
                isTodayDate && !isSelected && !isBooked && !isBlockedDate && 'ring-2 ring-blue-500 dark:ring-blue-400 ring-inset',
                // Dias com agendamento confirmado (verde)
                isConfirmed && !isPastDate && !isBlockedDate && adminMode && 'bg-green-50 dark:bg-green-900/40 hover:bg-green-100 dark:hover:bg-green-900/60 cursor-pointer hover:scale-105',
                isConfirmed && !isPastDate && !isBlockedDate && !adminMode && 'bg-green-50 dark:bg-green-900/40 cursor-not-allowed',
                isConfirmed && isPastDate && !isBlockedDate && adminMode && 'bg-green-50 dark:bg-green-900/30 opacity-60 hover:opacity-100 cursor-pointer hover:scale-105',
                isConfirmed && isPastDate && !isBlockedDate && !adminMode && 'bg-green-50 dark:bg-green-900/20 opacity-30 cursor-not-allowed',
                // Dias com agendamento pendente (vermelho/amarelo)
                isPending && !isConfirmed && !isPastDate && !isBlockedDate && adminMode && 'bg-yellow-50 dark:bg-yellow-900/40 hover:bg-yellow-100 dark:hover:bg-yellow-900/60 cursor-pointer hover:scale-105',
                isPending && !isConfirmed && !isPastDate && !isBlockedDate && !adminMode && 'bg-yellow-50 dark:bg-yellow-900/40 cursor-not-allowed',
                isPending && !isConfirmed && isPastDate && !isBlockedDate && adminMode && 'bg-yellow-50 dark:bg-yellow-900/30 opacity-60 hover:opacity-100 cursor-pointer hover:scale-105',
                isPending && !isConfirmed && isPastDate && !isBlockedDate && !adminMode && 'bg-yellow-50 dark:bg-yellow-900/20 opacity-30 cursor-not-allowed',
                // Dias bloqueados
                isBlockedDate && !adminMode && 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed',
                isBlockedDate && adminMode && !isPastDate && 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer hover:scale-105'
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium transition-colors',
                  isSelected && !isBooked && !isBlockedDate && 'text-white',
                  !isSelected && !isDisabled && 'text-gray-700 dark:text-gray-200',
                  isPastDate && !isBooked && !isBlockedDate && 'text-gray-400 dark:text-gray-500',
                  // Agendamentos confirmados (verde)
                  isConfirmed && !isPastDate && !isBlockedDate && 'text-green-600 dark:text-green-300 font-semibold',
                  isConfirmed && isPastDate && !isBlockedDate && adminMode && 'text-green-500 dark:text-green-400 font-semibold',
                  isConfirmed && isPastDate && !isBlockedDate && !adminMode && 'text-gray-400 dark:text-gray-500',
                  // Agendamentos pendentes (amarelo)
                  isPending && !isConfirmed && !isPastDate && !isBlockedDate && 'text-yellow-700 dark:text-yellow-300 font-semibold',
                  isPending && !isConfirmed && isPastDate && !isBlockedDate && adminMode && 'text-yellow-600 dark:text-yellow-400 font-semibold',
                  isPending && !isConfirmed && isPastDate && !isBlockedDate && !adminMode && 'text-gray-400 dark:text-gray-500',
                  // Bloqueados
                  isBlockedDate && 'text-gray-500 dark:text-gray-400'
                )}
              >
                {day}
              </span>

              {/* Ícone de bloqueado */}
              {isBlockedDate && (
                <div className="absolute top-1 right-1">
                  <svg className="w-3 h-3 text-gray-500 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Indicador de agendamentos */}
              {dayBookings.length > 0 && !isBlockedDate && (
                <div className="absolute bottom-1">
                  <div className={cn(
                    'w-1 h-1 rounded-full',
                    // Confirmados - verde
                    isConfirmed && !isPastDate && 'bg-green-500',
                    isConfirmed && isPastDate && adminMode && 'bg-green-400',
                    isConfirmed && isPastDate && !adminMode && 'bg-gray-300',
                    // Pendentes - amarelo
                    isPending && !isConfirmed && !isPastDate && 'bg-yellow-500',
                    isPending && !isConfirmed && isPastDate && adminMode && 'bg-yellow-400',
                    isPending && !isConfirmed && isPastDate && !adminMode && 'bg-gray-300'
                  )} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legenda minimalista */}
      <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-300 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" />
          <span className="font-light">Confirmado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500 dark:bg-yellow-400" />
          <span className="font-light">Pendente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" />
          <span className="font-light">Bloqueado</span>
        </div>
        {!adminMode && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            <span className="font-light">Selecionado</span>
          </div>
        )}
      </div>
    </div>
  );
}
