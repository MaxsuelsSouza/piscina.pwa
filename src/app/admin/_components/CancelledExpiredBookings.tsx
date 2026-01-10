/**
 * Componente de lista de agendamentos cancelados e expirados
 */

'use client';

import { cn } from '@/lib/utils';
import type { Booking } from '@/app/(home)/_types/booking';

interface CancelledExpiredBookingsProps {
  bookings: Booking[];
  onView: (booking: Booking) => void;
}

export function CancelledExpiredBookings({ bookings, onView }: CancelledExpiredBookingsProps) {
  const cancelledAndExpired = bookings.filter(b => {
    if (b.status === 'cancelled') return true;
    if (b.status === 'pending' && b.expiresAt) {
      return new Date(b.expiresAt) <= new Date();
    }
    return false;
  });

  if (cancelledAndExpired.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 mt-6">
      <h2 className="text-lg font-light text-gray-900 dark:text-gray-100 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
        Cancelados e Expirados <span className="text-sm text-gray-400 dark:text-gray-400 font-light">({cancelledAndExpired.length})</span>
      </h2>
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {cancelledAndExpired
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(booking => {
            const isExpired = booking.status === 'pending' && booking.expiresAt && new Date(booking.expiresAt) <= new Date();

            return (
              <div
                key={booking.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
                onClick={() => onView(booking)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-2">
                      {booking.customerName}
                    </h3>
                    <span className={cn(
                      'inline-block px-2.5 py-1 text-xs rounded-full font-medium',
                      booking.status === 'cancelled' && 'bg-red-100 dark:bg-red-900/30 text-red-700',
                      isExpired && 'bg-orange-100 text-orange-700'
                    )}>
                      {booking.status === 'cancelled' ? 'Cancelado' : 'Expirado'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-300">
                    {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600 dark:text-gray-200 font-light flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {booking.customerPhone}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-200 font-light flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'pessoa' : 'pessoas'}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
