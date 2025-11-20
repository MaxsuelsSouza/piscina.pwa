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

      // Passa o slug ao invés do client
      // O slug será usado server-side para buscar o cliente correto
      // Isso previne manipulação do ownerId no client-side
      const response = await createPublicBooking(slug, selectedDate, formData);

      if (response.success) {
        // Formata a data para exibição
        const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR');

        // Nome do estabelecimento ou do cliente
        const businessName = client.businessName || client.displayName || 'o estabelecimento';

        // Cria mensagem para WhatsApp
        const message = encodeURIComponent(
          `🎉 *NOVO AGENDAMENTO - ${businessName.toUpperCase()}*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📅 *Data:* ${formattedDate}\n` +
          `⏰ *Período:* Dia Inteiro (08:00 - 22:00)\n` +
          `👤 *Nome:* ${formData.customerName}\n` +
          `📱 *Telefone:* ${formData.customerPhone}\n` +
          `👥 *Quantidade:* ${formData.numberOfPeople} ${formData.numberOfPeople === 1 ? 'pessoa' : 'pessoas'}\n` +
          `💰 *Valor:* R$ 400,00\n` +
          `${formData.notes ? `📝 *Observações:* ${formData.notes}\n` : ''}` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⚠️ *Status:* PENDENTE\n\n` +
          `Por favor, envie:\n` +
          `✅ Dados para pagamento (PIX/Transferência)\n` +
          `✅ Comprovante após realizar o pagamento\n\n` +
          `Aguardo retorno para confirmação! 😊`
        );

        // Usa o telefone do dono do estabelecimento (cliente)
        // Se o cliente não tiver telefone, usa o número do admin/sistema
        // Remove todos os caracteres não numéricos
        const clientPhone = client.phone?.replace(/\D/g, '') || '';
        const adminPhone = '5581997339707'; // WhatsApp do admin/sistema
        const whatsappNumber = clientPhone || adminPhone;

        console.log('🔍 Debug WhatsApp:', {
          clientPhone: client.phone,
          clientPhoneCleaned: clientPhone,
          usingAdminPhone: !clientPhone,
          whatsappNumber,
          message: message.substring(0, 50) + '...'
        });

        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
        console.log('📱 Abrindo WhatsApp:', whatsappUrl);

        // Tenta abrir em uma nova aba
        const newWindow = window.open(whatsappUrl, '_blank');

        if (!newWindow) {
          console.error('❌ Popup bloqueado! Tentando abrir na mesma aba...');
          window.location.href = whatsappUrl;
        }

        // Fecha o formulário e limpa a seleção
        setShowForm(false);
        setSelectedDate('');
      } else {
        toast.error(response.error || 'Erro ao criar agendamento. Por favor, tente novamente.');
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
