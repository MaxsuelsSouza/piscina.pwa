/**
 * Hook para gerenciar dados do painel administrativo com Firestore
 * Suporta filtro por ownerId para clientes
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
import { createBlockedDate, deleteBlockedDate } from '@/lib/firebase/firestore/blockedDates';

interface UseAdminDataParams {
  isAdmin?: boolean;
  ownerId?: string;
}

export function useAdminData(params?: UseAdminDataParams) {
  const { isAdmin = true, ownerId } = params || {};
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [allBlockedDates, setAllBlockedDates] = useState<BlockedDate[]>([]);

  // Escuta mudanças nos agendamentos em tempo real
  useEffect(() => {
    const unsubscribeBookings = onBookingsChange((newBookings) => {
      setAllBookings(newBookings);
    });

    const unsubscribeBlockedDates = onBlockedDatesChange((dates) => {
      setAllBlockedDates(dates);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeBlockedDates();
    };
  }, []);

  // Filtra os dados baseado no tipo de usuário
  const bookings = isAdmin
    ? allBookings
    : allBookings.filter(b => {
        // Debug: log para verificar filtragem
        if (process.env.NODE_ENV === 'development') {
          console.log('🔍 Filtrando agendamento:', {
            bookingId: b.id,
            bookingOwnerId: b.ownerId,
            userOwnerId: ownerId,
            match: b.ownerId === ownerId
          });
        }
        return b.ownerId === ownerId;
      });

  const blockedDates = isAdmin
    ? allBlockedDates
    : allBlockedDates.filter(d => d.ownerId === ownerId);

  // Debug: log do resultado da filtragem
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Dados do painel:', {
      isAdmin,
      ownerId,
      totalBookings: allBookings.length,
      filteredBookings: bookings.length,
      totalBlockedDates: allBlockedDates.length,
      filteredBlockedDates: blockedDates.length
    });
  }

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
      if (isAdmin) {
        // Admin bloqueia sem ownerId (bloqueio público)
        await blockDateService(date);
      } else if (ownerId) {
        // Cliente bloqueia com seu ownerId
        await createBlockedDate(date, ownerId);
      }
    } catch (error) {
      console.error('❌ Erro ao bloquear data:', error);
      throw error;
    }
  };

  const unblockDate = async (date: string) => {
    try {
      if (isAdmin) {
        // Admin usa a função padrão
        await unblockDateService(date);
      } else {
        // Cliente deleta apenas seus bloqueios
        const blockedDate = allBlockedDates.find(d => d.date === date && d.ownerId === ownerId);
        if (blockedDate) {
          await deleteBlockedDate(blockedDate.id);
        }
      }
    } catch (error) {
      console.error('❌ Erro ao desbloquear data:', error);
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
