'use client';

/**
 * Página pública de agendamento para um cliente específico
 * URL: /agendamento/[slug]
 */

import { useParams } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { BookingCalendar } from '@/app/(home)/_components/BookingCalendar';
import { BookingForm } from '@/app/(home)/_components/BookingForm';
import { PixPaymentModal } from '@/components/PixPaymentModal';
import { usePublicBooking } from './_hooks';
import { defaultSchedule } from './_utils/defaultSchedule';
import {
  PublicBookingHeader,
  CalendarNavigation,
  LoadingState,
  ErrorState,
  BarbershopBookingFlow,
} from './_components';

export default function PublicBookingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const formRef = useRef<HTMLDivElement>(null);

  const {
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
  } = usePublicBooking(slug);

  // Scroll suave para o topo quando mostrar o formulário
  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [showForm]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !client) {
    return <ErrorState error={error} />;
  }

  // Detecta se é barbearia
  const isBarbershop = client.venueType === 'barbershop';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <PublicBookingHeader clientName={client.businessName || client.displayName} />

      <div className="max-w-4xl mx-auto px-4 -mt-20 pb-12">
        {/* Calendário - Expandido ou Minimizado */}
        {!showForm ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 mb-8 backdrop-blur-sm">
            <CalendarNavigation
              currentDate={currentDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />

            <BookingCalendar
              bookings={bookings}
              blockedDates={blockedDates}
              currentDate={currentDate}
              selectedDates={selectedDate ? [selectedDate] : []}
              onSelectDate={handleDateClick}
              adminMode={false}
            />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-4 mb-6 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                  {selectedDate && new Date(selectedDate + 'T00:00:00').getDate()}
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Data selecionada</div>
                  <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  // Limpa dados salvos quando trocar de data
                  if (selectedDate) {
                    localStorage.removeItem(`barbershop-booking-${selectedDate}`);
                  }
                  setShowForm(false);
                  setSelectedDate('');
                }}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Trocar data
              </button>
            </div>
          </div>
        )}

        {/* Formulário de agendamento */}
        {showForm && selectedDate && (
          <div ref={formRef} className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {isBarbershop ? 'Agende seu horário' : 'Novo Agendamento'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isBarbershop ? 'Escolha o profissional e os serviços desejados' : 'Complete os dados abaixo para finalizar seu agendamento'}
              </p>
            </div>

            {isBarbershop ? (
              <BarbershopBookingFlow
                selectedDate={selectedDate}
                professionals={client.venueInfo?.barbershopInfo?.professionals || []}
                services={client.venueInfo?.barbershopInfo?.services || []}
                existingBookings={serviceBookings}
                schedule={client.venueInfo?.barbershopInfo?.schedule || defaultSchedule}
                onSubmit={handleSubmitBooking}
                onCancel={handleCancelBooking}
                isSubmitting={creatingBooking}
                onDateChange={setSelectedDate}
              />
            ) : (
              <BookingForm
                selectedDate={selectedDate}
                onSubmit={handleSubmitBooking}
                onCancel={handleCancelBooking}
                isSubmitting={creatingBooking}
                pricePerDay={client?.venueInfo?.condominiumPrice}
              />
            )}
          </div>
        )}
      </div>

      {/* Modal de Pagamento PIX */}
      {paymentData && (
        <PixPaymentModal
          isOpen={!!paymentData}
          onClose={handleClosePaymentModal}
          qrCodeBase64={paymentData.qrCodeBase64}
          qrCodeText={paymentData.qrCode}
          amount={paymentData.amount}
          bookingId={paymentData.bookingId}
          bookingDate={paymentData.bookingDate}
          customerName={paymentData.customerName}
          customerPhone={paymentData.customerPhone}
          numberOfPeople={paymentData.numberOfPeople}
          notes={paymentData.notes}
          clientPhone={paymentData.clientPhone}
          businessName={paymentData.businessName}
        />
      )}

      {/* Loading Overlay */}
      {creatingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>

              {/* Mensagens */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Criando agendamento...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Gerando pagamento PIX
                </p>
              </div>

              {/* Dica */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
                Aguarde enquanto preparamos seu QR Code de pagamento
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
