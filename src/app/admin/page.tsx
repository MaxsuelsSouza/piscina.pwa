/**
 * Página administrativa de gerenciamento de agendamentos
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookingCalendar } from '../(home)/_components/BookingCalendar';
import { BookingDetailsModal } from '../(home)/_components/BookingDetailsModal';
import { useAdminData } from './_hooks/useAdminData';
import { calculateMonthlyStats } from './_utils/calculations';
import {
  AdminStats,
  PendingBookings,
  CancelledExpiredBookings,
  DateActionModal,
  ExpiredNotifications
} from './_components';
import type { Booking } from '../(home)/_types/booking';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDateActionModal, setShowDateActionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');

  const {
    bookings,
    blockedDates,
    confirmBooking,
    cancelBooking,
    blockDate,
    unblockDate,
    markExpirationNotificationSent
  } = useAdminData();

  const stats = calculateMonthlyStats(bookings, currentDate);

  // Redireciona para login se não estiver autenticado ou não for admin
  useEffect(() => {
    if (user === null) {
      router.push('/login');
    } else if (user && !isAdmin) {
      router.push('/');
    }
  }, [user, isAdmin, router]);

  // Detecta e envia notificações automaticamente para agendamentos expirados
  useEffect(() => {
    if (!isAdmin) return;

    const checkExpiredBookings = () => {
      const expiredBookings = bookings.filter(b => {
        if (b.status !== 'pending') return false;
        if (!b.expiresAt) return false;
        if (b.expirationNotificationSent) return false;
        return new Date(b.expiresAt) <= new Date();
      });

      // Envia notificação para o primeiro agendamento expirado não notificado
      if (expiredBookings.length > 0) {
        const booking = expiredBookings[0];
        const phoneNumber = booking.customerPhone.replace(/\D/g, '');
        const message = encodeURIComponent(
          `Olá ${booking.customerName}!\n\n` +
          `Seu agendamento para o dia ${new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR')} expirou.\n\n` +
          `O prazo de 1 hora para envio do comprovante de pagamento foi atingido e o agendamento foi cancelado automaticamente.\n\n` +
          `Se ainda tiver interesse, por favor faça um novo agendamento.\n\n` +
          `Obrigado!`
        );

        // Abre WhatsApp automaticamente
        window.open(`https://wa.me/55${phoneNumber}?text=${message}`, '_blank');

        // Marca como notificado
        markExpirationNotificationSent(booking.id);
      }
    };

    // Verifica a cada 30 segundos
    const interval = setInterval(checkExpiredBookings, 30000);

    // Verifica imediatamente ao carregar
    checkExpiredBookings();

    return () => clearInterval(interval);
  }, [bookings, isAdmin, markExpirationNotificationSent]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleDateClick = (dateOrBooking: string | Booking) => {
    if (typeof dateOrBooking !== 'string') {
      setSelectedBooking(dateOrBooking);
      return;
    }

    setSelectedDate(dateOrBooking);
    setShowDateActionModal(true);
  };

  const handleBlockDate = () => {
    if (!selectedDate) return;
    blockDate(selectedDate);
    setShowDateActionModal(false);
    setSelectedDate('');
  };

  const handleUnblockDate = () => {
    if (!selectedDate) return;
    if (confirm('Deseja desbloquear esta data?')) {
      unblockDate(selectedDate);
      setShowDateActionModal(false);
      setSelectedDate('');
    }
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Filtra agendamentos do mês atual para lista de pendentes
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthlyBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date + 'T00:00:00');
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });

  // Mostra loading enquanto verifica autenticação
  if (user === undefined || (user && isAdmin === undefined)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não for admin, não renderiza nada (o useEffect vai redirecionar)
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-light text-white mb-2 tracking-tight">
                Painel Administrativo
              </h1>
              <p className="text-gray-400 text-sm font-light">
                Gerencie agendamentos e visualize métricas
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
        <AdminStats {...stats} />

        {/* Notificações de expiração */}
        <ExpiredNotifications
          bookings={bookings}
          onMarkAsSent={markExpirationNotificationSent}
        />

        {/* Layout em duas colunas: Calendário + Pendentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* Calendário - 2 colunas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              {/* Navegação integrada */}
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

              {/* Calendário com escala reduzida */}
              <div className="scale-[0.85] origin-top -my-4">
                <BookingCalendar
                  currentDate={currentDate}
                  bookings={bookings}
                  selectedDates={[]}
                  onSelectDate={handleDateClick}
                  onViewBooking={handleDateClick}
                  multiSelectMode={false}
                  blockedDates={blockedDates}
                  adminMode={true}
                />
              </div>
            </div>
          </div>

          {/* Agendamentos Pendentes - 1 coluna */}
          <PendingBookings
            bookings={monthlyBookings}
            onConfirm={confirmBooking}
            onView={setSelectedBooking}
          />
        </div>

        {/* Seção de Cancelados e Expirados */}
        <CancelledExpiredBookings
          bookings={bookings}
          onView={setSelectedBooking}
        />
      </div>

      {/* Modal de Ações da Data */}
      {showDateActionModal && selectedDate && (
        <DateActionModal
          selectedDate={selectedDate}
          blockedDates={blockedDates}
          onClose={() => {
            setShowDateActionModal(false);
            setSelectedDate('');
          }}
          onBlock={handleBlockDate}
          onUnblock={handleUnblockDate}
        />
      )}

      {/* Modal de detalhes */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onCancel={cancelBooking}
        />
      )}
    </div>
  );
}
