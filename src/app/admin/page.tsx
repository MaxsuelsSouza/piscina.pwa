/**
 * Página administrativa de gerenciamento de agendamentos
 */

"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { BookingCalendar } from '../(home)/_components/BookingCalendar';
import { BookingDetailsModal } from '../(home)/_components/BookingDetailsModal';
import { ProfileIncompleteModal } from './_components/ProfileIncompleteModal';
import { useAdminData } from './_hooks/useAdminData';
import { calculateMonthlyStats } from './_utils/calculations';
import { calculateProfileCompleteness } from '@/utils/profileCompleteness';
import {
  AdminStats,
  PendingBookings,
  CancelledExpiredBookings,
  DateActionModal
} from './_components';
import type { Booking } from '../(home)/_types/booking';
import { useToast } from '@/hooks/useToast';

function AdminPageContent() {
  const router = useRouter();
  const { user, userData, isAdmin, logout } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDateActionModal, setShowDateActionModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showProfileIncompleteModal, setShowProfileIncompleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Calcula completude do perfil
  const profileCompleteness = useMemo(() => {
    return calculateProfileCompleteness(userData);
  }, [userData]);

  const {
    bookings,
    blockedDates,
    confirmBooking,
    cancelBooking,
    blockDate,
    unblockDate,
    markExpirationNotificationSent
  } = useAdminData({
    isAdmin,
    ownerId: user?.uid
  });

  // Detecta e envia mensagem WhatsApp para agendamentos expirados
  useEffect(() => {
    const checkExpiredBookings = async () => {
      const expiredBookings = bookings.filter(b => {
        if (b.status !== 'pending') return false;
        if (!b.expiresAt) return false;
        if (b.expirationNotificationSent) return false;
        return new Date(b.expiresAt) <= new Date();
      });

      // Abre WhatsApp para o primeiro agendamento expirado não notificado
      if (expiredBookings.length > 0) {
        const booking = expiredBookings[0];
        const formattedDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR');
        const phoneNumber = booking.customerPhone.replace(/\D/g, '');
        const message = encodeURIComponent(
          `Olá ${booking.customerName}!\n\n` +
          `Seu agendamento para o dia ${formattedDate} expirou.\n\n` +
          `O prazo de 1 hora para envio do comprovante de pagamento foi atingido e o agendamento foi cancelado automaticamente.\n\n` +
          `Se ainda tiver interesse, por favor faça um novo agendamento.\n\n` +
          `Obrigado!`
        );

        // Abre WhatsApp automaticamente
        window.open(`https://wa.me/55${phoneNumber}?text=${message}`, '_blank');

        // Marca como notificado
        try {
          await markExpirationNotificationSent(booking.id);
        } catch (error) {
          console.error('Erro ao marcar notificação como enviada:', error);
        }
      }
    };

    // Verifica a cada 30 segundos
    const interval = setInterval(checkExpiredBookings, 30000);

    // Verifica imediatamente ao carregar
    checkExpiredBookings();

    return () => clearInterval(interval);
  }, [bookings, markExpirationNotificationSent]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Intercepta ações quando usuário está inativo
  const handleActionWithCheck = (action: () => void) => {
    if (userData?.isActive === false) {
      setShowInactiveModal(true);
      return;
    }
    action();
  };

  const handleDateClick = (dateOrBooking: string | Booking) => {
    handleActionWithCheck(() => {
      if (typeof dateOrBooking !== 'string') {
        setSelectedBooking(dateOrBooking);
        return;
      }

      setSelectedDate(dateOrBooking);
      setShowDateActionModal(true);
    });
  };

  const handleBlockDate = async () => {
    if (!selectedDate) return;

    // Verifica se a data já está bloqueada
    const isAlreadyBlocked = blockedDates.some(d => d.date === selectedDate);

    if (isAlreadyBlocked) {
      console.log('⚠️ Data já bloqueada:', selectedDate);
      toast.error('Esta data já está bloqueada!');
      setShowDateActionModal(false);
      setSelectedDate('');
      return;
    }

    try {
      console.log('🔒 Bloqueando data:', selectedDate);
      await blockDate(selectedDate);
      setShowDateActionModal(false);
      setSelectedDate('');
      toast.success('Data bloqueada com sucesso!');
      console.log('✅ Data bloqueada com sucesso:', selectedDate);
    } catch (error) {
      console.error('❌ Erro ao bloquear data:', error);
      toast.error('Erro ao bloquear data. Tente novamente.');
    }
  };

  const handleUnblockDate = async () => {
    if (!selectedDate) return;

    const confirmed = await confirm({
      title: 'Desbloquear Data',
      message: 'Deseja desbloquear esta data?',
      confirmText: 'Sim, desbloquear',
      cancelText: 'Cancelar',
      variant: 'warning',
    });

    if (confirmed) {
      try {
        await unblockDate(selectedDate);
        setShowDateActionModal(false);
        setSelectedDate('');
        toast.success('Data desbloqueada com sucesso!');
      } catch (error) {
        toast.error('Erro ao desbloquear data. Tente novamente.');
      }
    }
  };

  const handleNextMonth = () => {
    handleActionWithCheck(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    });
  };

  const handlePrevMonth = () => {
    handleActionWithCheck(() => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    });
  };

  const handleGenerateLink = async () => {
    handleActionWithCheck(async () => {
      // Verifica se o perfil está >= 80% completo
      if (profileCompleteness.percentage < 80) {
        setShowProfileIncompleteModal(true);
        return;
      }

      // Se >= 80% e ainda não revelou, marca como revelado
      if (!userData?.linkRevealed && user?.uid) {
        try {
          const { updateUser } = await import('@/lib/firebase/firestore/users');
          await updateUser(user.uid, { linkRevealed: true });
          // O userData será atualizado automaticamente pelo AuthContext
        } catch (error) {
          console.error('Erro ao revelar link:', error);
        }
      }
    });
  };

  const handleCopyLink = () => {
    handleActionWithCheck(() => {
      if (!userData?.publicSlug) return;
      const publicUrl = `${window.location.origin}/agendamento/${userData.publicSlug}`;
      navigator.clipboard.writeText(publicUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Filtra agendamentos do mês atual para lista de pendentes
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const monthlyBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date + 'T00:00:00');
    return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
  });

  // Filtra agendamentos com base no termo de pesquisa
  const filteredBookings = useMemo(() => {
    if (!searchTerm.trim()) return bookings;

    const search = searchTerm.toLowerCase().trim();
    return bookings.filter(booking => {
      // Pesquisa por ID
      if (booking.id.toLowerCase().includes(search)) return true;

      // Pesquisa por nome do cliente
      if (booking.customerName?.toLowerCase().includes(search)) return true;

      // Pesquisa por telefone do cliente
      if (booking.customerPhone?.replace(/\D/g, '').includes(search.replace(/\D/g, ''))) return true;

      // Pesquisa por data (formato brasileiro)
      const bookingDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR');
      if (bookingDate.includes(search)) return true;

      return false;
    });
  }, [bookings, searchTerm]);

  // Filtra agendamentos mensais com base na pesquisa
  const filteredMonthlyBookings = useMemo(() => {
    if (!searchTerm.trim()) return monthlyBookings;

    const search = searchTerm.toLowerCase().trim();
    return monthlyBookings.filter(booking => {
      if (booking.id.toLowerCase().includes(search)) return true;
      if (booking.customerName?.toLowerCase().includes(search)) return true;
      if (booking.customerPhone?.replace(/\D/g, '').includes(search.replace(/\D/g, ''))) return true;
      const bookingDate = new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR');
      if (bookingDate.includes(search)) return true;
      return false;
    });
  }, [monthlyBookings, searchTerm]);

  // Calcula estatísticas com base nos agendamentos filtrados ou todos
  const stats = useMemo(() => {
    return calculateMonthlyStats(searchTerm ? filteredBookings : bookings, currentDate);
  }, [bookings, filteredBookings, currentDate, searchTerm]);

  // Filtra agendamentos expirados do calendário
  // Expirados só devem aparecer na seção "Cancelados e Expirados"
  const bookingsForCalendar = useMemo(() => {
    return filteredBookings.filter(b => {
      // Se o agendamento está pendente e expirou, não mostra no calendário
      if (b.status === 'pending' && b.expiresAt) {
        const expirationDate = new Date(b.expiresAt);
        const now = new Date();
        if (expirationDate <= now) {
          return false; // Agendamento expirado - não mostra no calendário
        }
      }
      return true;
    });
  }, [filteredBookings]);

  return (
    <div className="min-h-screen bg-white">
      {/* Alerta de Assinatura Inativa */}
      {userData?.isActive === false && (
        <div className="bg-red-500 text-white px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium">Assinatura Pendente</p>
                <p className="text-sm text-red-100">Regularize sua assinatura para continuar usando o sistema</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Hero */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 pt-6 md:pt-12 pb-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 min-w-0 mt-6 md:mt-9">
              <h1 className="text-2xl md:text-4xl font-light text-white mb-2 tracking-tight">
                {isAdmin ? 'Painel Administrativo' : 'Meus Agendamentos'}
              </h1>
              <p className="text-gray-400 text-xs md:text-sm font-light">
                {isAdmin ? 'Gerencie agendamentos e visualize métricas' : 'Gerencie seus agendamentos e bloqueios'}
              </p>

              {/* Link Público - Logo abaixo do título */}
              {userData?.publicSlug && (
                <div className="mt-4">
                  {/* Se link já foi revelado OU perfil >= 80%, mostra o link permanentemente */}
                  {userData.linkRevealed || profileCompleteness.percentage >= 80 ? (
                    <>
                      {/* Versão Desktop (>1024px) - URL completa + botão copiar */}
                      <div className="hidden lg:flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <span className="text-sm text-white/90 font-light">
                            {typeof window !== 'undefined' ? `${window.location.origin}/agendamento/${userData.publicSlug}` : ''}
                          </span>
                        </div>
                        <button
                          onClick={handleCopyLink}
                          className="px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl text-white hover:bg-blue-500/30 transition-all text-sm font-light flex items-center gap-2"
                        >
                          {linkCopied ? (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Copiado!
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copiar Link
                            </>
                          )}
                        </button>
                      </div>

                      {/* Versão Mobile/Tablet (<1024px) - Apenas botão "Link de agendamento" */}
                      <button
                        onClick={handleCopyLink}
                        className="flex lg:hidden items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl text-white hover:bg-blue-500/30 transition-all text-sm font-light"
                      >
                        {linkCopied ? (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copiado!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Link de Agendamento
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    /* Botão "Gerar Link Público" - aparece quando ainda não revelou E < 80% */
                    <button
                      onClick={handleGenerateLink}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm font-light"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      Gerar Link Público
                      <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                        {profileCompleteness.percentage}%
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Botões - Mobile: apenas ícones / Desktop: ícone + texto */}
            <div className="flex gap-1.5 md:gap-3 flex-shrink-0">
              <button
                onClick={() => router.push('/perfil')}
                className="flex items-center justify-center md:gap-2 p-2 md:px-5 md:py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm font-light"
                aria-label="Perfil"
              >
                <svg
                  className="w-5 h-5 md:w-4 md:h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="hidden md:inline">Perfil</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center md:gap-2 p-2 md:px-6 md:py-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all text-sm font-light"
                aria-label="Sair"
              >
                <svg
                  className="w-5 h-5 md:w-4 md:h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16">
        {/* Cards de métricas */}
        <AdminStats {...stats} />

        {/* Campo de Pesquisa */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Pesquisar por nome, telefone, data ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pr-12 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          {searchTerm && (
            <p className="mt-2 text-sm text-gray-600">
              {filteredBookings.length} {filteredBookings.length === 1 ? 'agendamento encontrado' : 'agendamentos encontrados'}
            </p>
          )}
        </div>

        {/* Layout em duas colunas: Calendário + Pendentes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-8">
          {/* Calendário - 2 colunas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              {/* Navegação integrada */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-light text-gray-900 capitalize">
                  {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-gray-50 rounded-xl transition-all duration-200 text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendário com escala reduzida */}
              <div className="scale-[0.85] origin-top -my-4">
                <BookingCalendar
                  currentDate={currentDate}
                  bookings={bookingsForCalendar}
                  selectedDates={[]}
                  onSelectDate={handleDateClick}
                  onViewBooking={handleDateClick}
                  multiSelectMode={false}
                  blockedDates={blockedDates}
                  adminMode={true}
                />
              </div>
            </div>
          </div>

          {/* Agendamentos Pendentes - 1 coluna */}
          <PendingBookings
            bookings={filteredMonthlyBookings}
            onConfirm={confirmBooking}
            onView={setSelectedBooking}
          />
        </div>

        {/* Seção de Cancelados e Expirados */}
        <CancelledExpiredBookings
          bookings={filteredBookings}
          onView={setSelectedBooking}
        />
      </div>

      {/* Modal de Ações da Data */}
      {showDateActionModal && selectedDate && (
        <DateActionModal
          selectedDate={selectedDate}
          blockedDates={blockedDates}
          onClose={() => {
            setShowDateActionModal(false);
            setSelectedDate('');
          }}
          onBlock={handleBlockDate}
          onUnblock={handleUnblockDate}
        />
      )}

      {/* Modal de detalhes */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onConfirm={confirmBooking}
          onCancel={cancelBooking}
          isAdmin={isAdmin}
        />
      )}

      {/* Modal de Assinatura Inativa */}
      {showInactiveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              {/* Ícone de alerta */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>

              {/* Mensagem */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Assinatura Inativa
              </h3>
              <p className="text-gray-600 mb-6">
                Sua assinatura está com pagamento atrasado. Por favor, regularize sua situação para continuar usando o sistema.
              </p>

              {/* Botão de fechar */}
              <button
                onClick={() => setShowInactiveModal(false)}
                className="w-full py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Perfil Incompleto */}
      {showProfileIncompleteModal && (
        <ProfileIncompleteModal
          percentage={profileCompleteness.percentage}
          missingFields={profileCompleteness.missingFields}
          onClose={() => setShowProfileIncompleteModal(false)}
        />
      )}
    </div>
  );
}

/**
 * Página de Agendamentos - EXCLUSIVA PARA CLIENTES
 * Admins devem usar /admin/painel
 */
export default function AdminPage() {
  return (
    <ProtectedRoute requireAdmin={false} blockAdmin={true}>
      <AdminPageContent />
    </ProtectedRoute>
  );
}
