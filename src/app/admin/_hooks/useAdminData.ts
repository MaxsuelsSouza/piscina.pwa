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
import { getUserByUid } from '@/lib/firebase/firestore/users';

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
      // Busca os dados do agendamento
      const booking = allBookings.find(b => b.id === id);

      if (!booking) {
        throw new Error('Agendamento não encontrado');
      }

      // Atualiza o status para confirmado
      await confirmBookingService(id);

      // Busca informações do dono do estabelecimento (owner)
      let businessName = 'o estabelecimento';
      if (booking.ownerId) {
        try {
          const owner = await getUserByUid(booking.ownerId);
          businessName = owner?.businessName || owner?.displayName || businessName;
        } catch (err) {
          console.error('⚠️ Erro ao buscar informações do owner:', err);
        }
      }

      // Formata a data para exibição
      const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Cria mensagem de confirmação para WhatsApp
      const message = encodeURIComponent(
        `✅ *AGENDAMENTO CONFIRMADO - ${businessName.toUpperCase()}*\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🎉 Seu agendamento foi confirmado!\n\n` +
        `📅 *Data:* ${formattedDate}\n` +
        `⏰ *Período:* Dia Inteiro (08:00 - 22:00)\n` +
        `👤 *Nome:* ${booking.customerName}\n` +
        `👥 *Quantidade:* ${booking.numberOfPeople} ${booking.numberOfPeople === 1 ? 'pessoa' : 'pessoas'}\n` +
        `💰 *Valor:* R$ 400,00\n` +
        `${booking.notes ? `📝 *Observações:* ${booking.notes}\n` : ''}` +
        `━━━━━━━━━━━━━━━━━━━━\n\n` +
        `✅ *Status:* CONFIRMADO\n\n` +
        `📍 Endereço e instruções de acesso serão enviados em breve.\n\n` +
        `Estamos ansiosos para recebê-lo(a)! 😊\n` +
        `Qualquer dúvida, estamos à disposição.`
      );

      // Remove caracteres não numéricos do telefone do cliente
      let customerPhone = booking.customerPhone.replace(/\D/g, '');

      // Se não começar com 55 (código do Brasil), adiciona
      if (!customerPhone.startsWith('55')) {
        customerPhone = '55' + customerPhone;
      }

      // Abre WhatsApp com a mensagem para o cliente
      const whatsappUrl = `https://wa.me/${customerPhone}?text=${message}`;

      console.log('📱 Enviando confirmação via WhatsApp:', {
        bookingId: id,
        customerName: booking.customerName,
        customerPhoneOriginal: booking.customerPhone,
        customerPhoneFormatted: customerPhone,
      });

      // Tenta abrir em uma nova aba
      const newWindow = window.open(whatsappUrl, '_blank');

      if (!newWindow) {
        console.error('❌ Popup bloqueado! Tentando abrir na mesma aba...');
        window.location.href = whatsappUrl;
      }
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
