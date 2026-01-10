/**
 * Hook para gerenciar agendamentos públicos
 */

import { useState, useEffect, useCallback } from 'react';
import {
  onBookingsChange,
  onBlockedDatesChange,
} from '@/services/bookings.service';
import { onServiceBookingsChange } from '@/services/serviceBookings.service';
import { fetchClientBySlug, createPublicBooking } from '../_services';
import { createBarbershopBooking, type BarbershopBookingData } from '../_services/barbershopBooking.service';
import type { ClientInfo, Booking, BlockedDate, PublicBookingFormData } from '../_types';
import type { ServiceBooking } from '@/types/barbershop';
import { useToast } from '@/hooks/useToast';

export function usePublicBooking(slug: string) {
  const toast = useToast();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [serviceBookings, setServiceBookings] = useState<ServiceBooking[]>([]);
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

    const isBarbershop = client.venueType === 'barbershop';

    // Se for barbearia, escuta serviceBookings em vez de bookings normais
    const unsubscribeBookings = isBarbershop
      ? onServiceBookingsChange(
          (allBookings) => {
            // Filtra apenas agendamentos ativos
            const activeBookings = allBookings.filter((b) => b.status !== 'cancelled');
            setServiceBookings(activeBookings);
          },
          client.uid,
          false
        )
      : onBookingsChange(
          (allBookings) => {
            // Filtra apenas agendamentos ativos (não cancelados e não expirados)
            const now = new Date();
            const activeBookings = allBookings.filter((b) => {
              // Remove cancelados
              if (b.status === 'cancelled') return false;

              // Se está pendente e tem expiresAt, verifica se não expirou
              if (b.status === 'pending' && b.expiresAt) {
                const expiresAt = new Date(b.expiresAt);
                // Se expirou, não considera
                if (now > expiresAt) return false;
              }

              return true;
            });

            setBookings(activeBookings);
          },
          client.uid, // ownerId
          false // não é admin
        );

    const unsubscribeBlockedDates = onBlockedDatesChange(
      (allDates) => {
        // Filtra apenas bloqueios que não expiraram (data >= hoje)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeDates = allDates.filter((d) => {
          const blockedDate = new Date(d.date + 'T00:00:00');
          return blockedDate >= today;
        });

        setBlockedDates(activeDates);
      },
      client.uid, // ownerId
      false // não é admin
    );

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
    async (formData: PublicBookingFormData | BarbershopBookingData) => {
      if (!client || !selectedDate || !slug) return;

      setCreatingBooking(true);

      try {
        const isBarbershop = client.venueType === 'barbershop';

        if (isBarbershop) {
          // Agendamento de barbearia
          const barbershopData = formData as BarbershopBookingData;
          const response = await createBarbershopBooking(slug, selectedDate, barbershopData);

          if (response.success) {
            setShowForm(false);
            setSelectedDate('');

            // Verifica se requer pagamento PIX
            if (response.requiresPayment && response.payment) {
              // Mostra modal de pagamento PIX
              setPaymentData({
                qrCodeBase64: response.payment.qrCodeBase64,
                qrCode: response.payment.qrCode,
                amount: response.payment.amount,
                bookingId: response.bookingId || '',
                bookingDate: selectedDate,
                customerName: barbershopData.customerName,
                customerPhone: barbershopData.customerPhone,
                numberOfPeople: 1, // Barbearia não usa numberOfPeople
                notes: barbershopData.notes,
                clientPhone: response.ownerPhone || '',
                businessName: response.businessName || '',
              });
              toast.warning(
                response.message || 'Agendamento criado! Complete o pagamento PIX para confirmar.',
                6000
              );
            } else {
              // Confirmado automaticamente - abre WhatsApp do dono
              toast.success(
                response.message || 'Agendamento confirmado com sucesso!',
                6000
              );

              // Envia notificação via WhatsApp para o dono
              if (response.ownerPhone) {
                const message = `Olá! Novo agendamento confirmado:\n\n` +
                  `📅 Data: ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}\n` +
                  `👤 Cliente: ${barbershopData.customerName}\n` +
                  `📞 Telefone: ${barbershopData.customerPhone}\n\n` +
                  `Acesse seu painel para mais detalhes.`;

                const phoneNumber = response.ownerPhone.replace(/\D/g, '');
                const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;

                // Abre WhatsApp em nova aba
                window.open(whatsappUrl, '_blank');
              }
            }
          } else {
            toast.error(
              response.error || 'Erro ao criar agendamento. Tente novamente.'
            );
          }
        } else {
          // Agendamento de espaço de festa (existente)
          const eventSpaceData = formData as PublicBookingFormData;
          const response = await createPublicBooking(slug, selectedDate, eventSpaceData);

          if (response.success) {
            setShowForm(false);
            setSelectedDate('');

            if (response.payment && response.bookingId) {
              setPaymentData({
                qrCodeBase64: response.payment.qrCodeBase64,
                qrCode: response.payment.qrCode,
                amount: response.payment.amount,
                bookingId: response.bookingId,
                bookingDate: selectedDate,
                customerName: eventSpaceData.customerName,
                customerPhone: eventSpaceData.customerPhone,
                numberOfPeople: eventSpaceData.numberOfPeople,
                notes: eventSpaceData.notes,
                clientPhone: client.phone,
                businessName: client.businessName || client.displayName,
              });
              toast.warning(
                'Agendamento criado! Complete o pagamento PIX para reservar.',
                6000
              );
            } else {
              toast.warning(
                'Agendamento criado! Entre em contato para confirmar o pagamento.',
                6000
              );
            }
          } else {
            toast.error(
              response.error || 'Erro ao criar agendamento. Por favor, tente novamente.'
            );
          }
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
    serviceBookings,
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
    setSelectedDate,
  };
}
