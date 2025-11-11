/**
 * Hook para gerenciar agendamentos públicos
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onBookingsChange,
  onBlockedDatesChange,
} from '@/services/bookings.service';
import { fetchClientBySlug, createPublicBooking } from '../_services';
import type { ClientInfo, Booking, BlockedDate, PublicBookingFormData } from '../_types';

export function usePublicBooking(slug: string) {
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  /**
   * Carrega informações do cliente
   */
  useEffect(() => {
    const loadClient = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      const response = await fetchClientBySlug(slug);

      if (response.success && response.client) {
        setClient(response.client);
      } else {
        setError(response.error || 'Erro ao carregar informações');
      }

      setLoading(false);
    };

    loadClient();
  }, [slug]);

  /**
   * Escuta agendamentos e bloqueios em tempo real
   */
  useEffect(() => {
    if (!client) return;

    const unsubscribeBookings = onBookingsChange((allBookings) => {
      // Filtra apenas agendamentos deste cliente
      const clientBookings = allBookings.filter((b) => b.ownerId === client.uid);
      setBookings(clientBookings);
    });

    const unsubscribeBlockedDates = onBlockedDatesChange((allDates) => {
      // Filtra apenas bloqueios deste cliente
      const clientBlockedDates = allDates.filter((d) => d.ownerId === client.uid);
      setBlockedDates(clientBlockedDates);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeBlockedDates();
    };
  }, [client]);

  /**
   * Seleciona uma data e abre o formulário
   */
  const handleDateClick = useCallback((date: string) => {
    setSelectedDate(date);
    setShowForm(true);
  }, []);

  /**
   * Navega para o próximo mês
   */
  const handleNextMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }, []);

  /**
   * Navega para o mês anterior
   */
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }, []);

  /**
   * Submete um novo agendamento
   */
  const handleSubmitBooking = useCallback(
    async (formData: PublicBookingFormData) => {
      if (!client || !selectedDate) return;

      const response = await createPublicBooking(client, selectedDate, formData);

      if (response.success) {
        alert(
          'Agendamento realizado com sucesso! O proprietário entrará em contato para confirmar.'
        );
        setShowForm(false);
        setSelectedDate('');
      } else {
        alert(response.error || 'Erro ao criar agendamento. Por favor, tente novamente.');
      }
    },
    [client, selectedDate]
  );

  /**
   * Cancela o agendamento e fecha o formulário
   */
  const handleCancelBooking = useCallback(() => {
    setShowForm(false);
    setSelectedDate('');
  }, []);

  return {
    client,
    loading,
    error,
    bookings,
    blockedDates,
    currentDate,
    selectedDate,
    showForm,
    handleDateClick,
    handleNextMonth,
    handlePrevMonth,
    handleSubmitBooking,
    handleCancelBooking,
    setShowForm,
  };
}
