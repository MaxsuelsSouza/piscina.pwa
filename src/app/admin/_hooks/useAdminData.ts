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
    const unsubscribeBookings = onBookingsChange((newBookings) => {
      setBookings(newBookings);
    });

    const unsubscribeBlockedDates = onBlockedDatesChange((dates) => {
      setBlockedDates(dates);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeBlockedDates();
    };
  }, []);

  const confirmBooking = async (id: string) => {
    try {
      await confirmBookingService(id);
    } catch (error) {
      console.error('❌ Admin: Erro ao confirmar agendamento:', error);
      throw error;
    }
  };

  const cancelBooking = async (id: string) => {
    try {
      await cancelBookingService(id);
    } catch (error) {
      console.error('❌ Admin: Erro ao cancelar agendamento:', error);
      throw error;
    }
  };

  const blockDate = async (date: string) => {
    try {
      await blockDateService(date);
    } catch (error) {
      console.error('❌ Admin: Erro ao bloquear data:', error);
      throw error;
    }
  };

  const unblockDate = async (date: string) => {
    try {
      await unblockDateService(date);
    } catch (error) {
      console.error('❌ Admin: Erro ao desbloquear data:', error);
      throw error;
    }
  };

  const markExpirationNotificationSent = async (id: string) => {
    try {
      await markExpirationService(id);
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
