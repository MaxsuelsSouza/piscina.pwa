/**
 * Hook para gerenciar agendamentos do barbeiro
 */

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase/config';
import { useToast } from '@/hooks/useToast';
import type { Booking } from '@/app/(home)/_types/booking';

export function useBarberBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  /**
   * Carrega agendamentos do barbeiro
   */
  const loadBookings = useCallback(async (startDate?: string, endDate?: string) => {
    try {
      setLoading(true);
      setError(null);

      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const token = await user.getIdToken();

      let url = '/api/barber/bookings';
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao buscar agendamentos');
      }

      const data = await response.json();
      setBookings(data.bookings);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar agendamentos');
      toast.error(err.message || 'Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Atualiza status de um agendamento
   */
  const updateBookingStatus = useCallback(async (
    bookingId: string,
    status: 'pending' | 'confirmed' | 'cancelled'
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const token = await user.getIdToken();
      const response = await fetch(`/api/barber/bookings/${bookingId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao atualizar agendamento');
      }

      // Atualiza localmente
      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, status } : booking
        )
      );

      toast.success('Agendamento atualizado com sucesso!');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar agendamento');
      throw err;
    }
  }, [toast]);

  // Carrega agendamentos ao montar o componente
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return {
    bookings,
    loading,
    error,
    loadBookings,
    updateBookingStatus,
  };
}
