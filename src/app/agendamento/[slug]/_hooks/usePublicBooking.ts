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
import { useToast } from '@/hooks/useToast';

export function usePublicBooking(slug: string) {
  const toast = useToast();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creatingBooking, setCreatingBooking] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    qrCodeBase64: string;
    qrCode: string;
    amount: number;
    bookingId: string;
    bookingDate: string;
    customerName: string;
    customerPhone: string;
    numberOfPeople: number;
    notes?: string;
    clientPhone?: string;
    businessName?: string;
  } | null>(null);

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
   * Atualiza o título da aba do navegador dinamicamente
   * com o nome do espaço do cliente
   */
  useEffect(() => {
    if (client) {
      // Prioriza businessName (nome do estabelecimento), depois displayName (nome da pessoa)
      const title = client.businessName || client.displayName || 'Agendamento';
      document.title = title;
    } else {
      // Título padrão enquanto carrega
      document.title = 'Carregando...';
    }

    // Restaura o título original quando o componente for desmontado
    return () => {
      document.title = 'Piscina';
    };
  }, [client]);

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
      // Filtra apenas bloqueios deste cliente e que não expiraram (data >= hoje)
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zera as horas para comparar apenas a data

      const clientBlockedDates = allDates.filter((d) => {
        if (d.ownerId !== client.uid) return false;

        // Verifica se a data não expirou
        const blockedDate = new Date(d.date + 'T00:00:00');
        return blockedDate >= today;
      });

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
      if (!client || !selectedDate || !slug) return;

      setCreatingBooking(true);

      try {
        // Passa o slug ao invés do client
        // O slug será usado server-side para buscar o cliente correto
        // Isso previne manipulação do ownerId no client-side
        const response = await createPublicBooking(slug, selectedDate, formData);

        if (response.success) {
          // Fecha o formulário
          setShowForm(false);
          setSelectedDate('');

          // Se houver dados de pagamento, exibe o modal de pagamento PIX
          if (response.payment && response.bookingId) {
            setPaymentData({
              qrCodeBase64: response.payment.qrCodeBase64,
              qrCode: response.payment.qrCode,
              amount: response.payment.amount,
              bookingId: response.bookingId,
              bookingDate: selectedDate,
              customerName: formData.customerName,
              customerPhone: formData.customerPhone,
              numberOfPeople: formData.numberOfPeople,
              notes: formData.notes,
              clientPhone: client.phone,
              businessName: client.businessName || client.displayName,
            });
            toast.warning(
              'Agendamento criado! Complete o pagamento PIX para confirmar.',
              6000 // 6 segundos
            );
          } else {
            // Fallback: se não houver pagamento (erro ao gerar), mostra mensagem
            toast.warning(
              'Agendamento criado! Entre em contato para confirmar o pagamento.',
              6000
            );
          }
        } else {
          toast.error(
            response.error ||
              'Erro ao criar agendamento. Por favor, tente novamente.'
          );
        }
      } finally {
        setCreatingBooking(false);
      }
    },
    [client, selectedDate, slug, toast]
  );

  /**
   * Cancela o agendamento e fecha o formulário
   */
  const handleCancelBooking = useCallback(() => {
    setShowForm(false);
    setSelectedDate('');
  }, []);

  /**
   * Fecha o modal de pagamento
   */
  const handleClosePaymentModal = useCallback(() => {
    setPaymentData(null);
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
    creatingBooking,
    paymentData,
    handleDateClick,
    handleNextMonth,
    handlePrevMonth,
    handleSubmitBooking,
    handleCancelBooking,
    handleClosePaymentModal,
    setShowForm,
  };
}
