'use client';

/**
 * Página do cliente para gerenciar seus próprios agendamentos
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCalendar } from '../(home)/_components/BookingCalendar';
import { BookingDetailsModal } from '../(home)/_components/BookingDetailsModal';
import { useClientBookings } from './_hooks/useClientBookings';
import type { Booking } from '../(home)/_types/booking';

export default function ClientePage() {
  const router = useRouter();
  const { user, userData, loading, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const {
    bookings,
    blockedDates,
    confirmBooking,
    cancelBooking,
    blockDate,
    unblockDate,
  } = useClientBookings(user?.uid);

  // Redireciona se não for cliente autenticado
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (userData?.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [user, userData, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDateClick = (date: string) => {
    // Clientes podem visualizar agendamentos, mas não criar novos
    const booking = bookings.find(b => b.date === date);
    if (booking) {
      setSelectedBooking(booking);
    }
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  // Filtra agendamentos do mês atual
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthlyBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date + 'T00:00:00');
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });

  const pendingBookings = monthlyBookings.filter(b => b.status === 'pending');
  const confirmedBookings = monthlyBookings.filter(b => b.status === 'confirmed');

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-light text-white mb-2 tracking-tight">
                Meus Agendamentos
              </h1>
              <p className="text-blue-200 text-sm font-light">
                {userData?.displayName || userData?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm font-light"
            >
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16">
        {/* Cards de métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-600">Pendentes</p>
                <p className="text-3xl font-light text-gray-900 mt-1">{pendingBookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-600">Confirmados</p>
                <p className="text-3xl font-light text-gray-900 mt-1">{confirmedBookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-light text-gray-600">Bloqueios</p>
                <p className="text-3xl font-light text-gray-900 mt-1">{blockedDates.length}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Calendário */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-lg font-light text-gray-900 capitalize">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <BookingCalendar
            bookings={bookings}
            blockedDates={blockedDates}
            currentDate={currentDate}
            onDateClick={handleDateClick}
            isAdmin={false}
          />
        </div>
      </div>

      {/* Modal de detalhes */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onConfirm={confirmBooking}
          onCancel={cancelBooking}
          isAdmin={false}
        />
      )}
    </div>
  );
}
