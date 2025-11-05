/**
 * Componente de lista de agendamentos pendentes
 */

'use client';

import type { Booking } from '@/app/(home)/_types/booking';

interface PendingBookingsProps {
  bookings: Booking[];
  onConfirm: (id: string) => Promise<void>;
  onView: (booking: Booking) => void;
}

export function PendingBookings({ bookings, onConfirm, onView }: PendingBookingsProps) {
  const pendingBookings = bookings.filter(b => {
    if (b.status !== 'pending') return false;
    if (b.expiresAt) {
      return new Date(b.expiresAt) > new Date();
    }
    return true;
  });

  return (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 h-full">
        <h2 className="text-lg font-light text-gray-900 mb-4 pb-4 border-b border-gray-100">
          Pendentes <span className="text-sm text-gray-400 font-light">({pendingBookings.length})</span>
        </h2>
        {pendingBookings.length > 0 ? (
          <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2">
            {pendingBookings.map(booking => {
              const expiresIn = booking.expiresAt
                ? Math.max(0, Math.floor((new Date(booking.expiresAt).getTime() - new Date().getTime()) / 60000))
                : 0;

              return (
                <div key={booking.id} className="p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all">
                  <div className="mb-3">
                    <h3 className="font-medium text-gray-900 text-sm mb-2">
                      {booking.customerName}
                    </h3>
                    {expiresIn > 0 && (
                      <span className="inline-block px-2.5 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 font-medium">
                        ⏱ {expiresIn}min
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-600 font-light flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                    <p className="text-xs text-gray-600 font-light flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {booking.customerPhone}
                    </p>
                    <p className="text-xs text-gray-600 font-light flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'pessoa' : 'pessoas'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onConfirm(booking.id)}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-xs font-medium shadow-sm"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => onView(booking)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all text-xs font-medium"
                    >
                      Ver mais
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 font-light">Nenhum agendamento pendente</p>
          </div>
        )}
      </div>
    </div>
  );
}
