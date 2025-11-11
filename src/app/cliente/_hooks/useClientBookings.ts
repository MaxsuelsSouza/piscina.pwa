/**
 * Hook para gerenciar agendamentos e bloqueios do cliente
 * Filtra apenas os dados pertencentes ao cliente logado
 */

import { useState, useEffect } from 'react';
import {
  getAllBookings,
  updateBookingStatus,
  getAllBlockedDates,
  createBlockedDate,
  deleteBlockedDate,
} from '@/lib/firebase/firestore/bookings';
import type { Booking, BlockedDate } from '@/app/(home)/_types/booking';

export function useClientBookings(clientId: string | undefined) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Carrega os dados quando o componente monta ou o clientId muda
  useEffect(() => {
    if (!clientId) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Carrega todos os agendamentos e filtra pelo ownerId
        const allBookings = await getAllBookings();
        const clientBookings = allBookings.filter(b => b.ownerId === clientId);
        setBookings(clientBookings);

        // Carrega todas as datas bloqueadas e filtra pelo ownerId
        const allBlockedDates = await getAllBlockedDates();
        const clientBlockedDates = allBlockedDates.filter(d => d.ownerId === clientId);
        setBlockedDates(clientBlockedDates);
      } catch (error) {
        console.error('Erro ao carregar dados do cliente:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [clientId]);

  /**
   * Confirma um agendamento
   */
  const confirmBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'confirmed');
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'confirmed' as const } : b))
      );
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error);
      throw error;
    }
  };

  /**
   * Cancela um agendamento
   */
  const cancelBooking = async (bookingId: string) => {
    try {
      await updateBookingStatus(bookingId, 'cancelled');
      setBookings(prev =>
        prev.map(b => (b.id === bookingId ? { ...b, status: 'cancelled' as const } : b))
      );
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      throw error;
    }
  };

  /**
   * Bloqueia uma data
   */
  const blockDate = async (date: string) => {
    if (!clientId) return;

    try {
      const newBlockedDate = await createBlockedDate(date, clientId);
      setBlockedDates(prev => [...prev, newBlockedDate]);
    } catch (error) {
      console.error('Erro ao bloquear data:', error);
      throw error;
    }
  };

  /**
   * Desbloqueia uma data
   */
  const unblockDate = async (date: string) => {
    if (!clientId) return;

    try {
      const blockedDate = blockedDates.find(d => d.date === date && d.ownerId === clientId);
      if (blockedDate) {
        await deleteBlockedDate(blockedDate.id);
        setBlockedDates(prev => prev.filter(d => d.id !== blockedDate.id));
      }
    } catch (error) {
      console.error('Erro ao desbloquear data:', error);
      throw error;
    }
  };

  return {
    bookings,
    blockedDates,
    loading,
    confirmBooking,
    cancelBooking,
    blockDate,
    unblockDate,
  };
}
