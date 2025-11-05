/**
 * Hook para gerenciar dados do painel administrativo com Firestore
 */

import { useState, useEffect } from 'react';
import type { Booking, BlockedDate } from '@/app/(home)/_types/booking';
import {
  onBookingsChange,
  onBlockedDatesChange,
  confirmBooking as confirmBookingService,
  cancelBooking as cancelBookingService,
  blockDate as blockDateService,
  unblockDate as unblockDateService,
  markExpirationNotificationSent as markExpirationService,
} from '@/services/bookings.service';

export function useAdminData() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  // Escuta mudanças nos agendamentos em tempo real
  useEffect(() => {
    console.log('📡 Admin: Conectando ao Firestore...');

    const unsubscribeBookings = onBookingsChange((newBookings) => {
      console.log('🔄 Admin: Agendamentos atualizados:', newBookings.length);
      setBookings(newBookings);
    });

    const unsubscribeBlockedDates = onBlockedDatesChange((dates) => {
      console.log('🔄 Admin: Datas bloqueadas atualizadas:', dates.length);
      setBlockedDates(dates);
    });

    return () => {
      console.log('🔌 Admin: Desconectando do Firestore...');
      unsubscribeBookings();
      unsubscribeBlockedDates();
    };
  }, []);

  const confirmBooking = async (id: string) => {
    try {
      await confirmBookingService(id);
      console.log('✅ Admin: Agendamento confirmado:', id);
    } catch (error) {
      console.error('❌ Admin: Erro ao confirmar agendamento:', error);
      throw error;
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      await cancelBookingService(id);
      console.log('✅ Admin: Agendamento cancelado:', id);
    } catch (error) {
      console.error('❌ Admin: Erro ao cancelar agendamento:', error);
      throw error;
    }
  };

  const blockDate = async (date: string) => {
    try {
      await blockDateService(date);
      console.log('✅ Admin: Data bloqueada:', date);
    } catch (error) {
      console.error('❌ Admin: Erro ao bloquear data:', error);
      throw error;
    }
  };

  const unblockDate = async (date: string) => {
    try {
      await unblockDateService(date);
      console.log('✅ Admin: Data desbloqueada:', date);
    } catch (error) {
      console.error('❌ Admin: Erro ao desbloquear data:', error);
      throw error;
    }
  };

  const markExpirationNotificationSent = async (id: string) => {
    try {
      await markExpirationService(id);
      console.log('✅ Admin: Notificação marcada como enviada:', id);
    } catch (error) {
      console.error('❌ Admin: Erro ao marcar notificação:', error);
      throw error;
    }
  };

  return {
    bookings,
    blockedDates,
    confirmBooking,
    cancelBooking,
    blockDate,
    unblockDate,
    markExpirationNotificationSent,
  };
}
