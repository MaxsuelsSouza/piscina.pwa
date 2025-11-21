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
import {
  PublicBookingHeader,
  CalendarNavigation,
  LoadingState,
  ErrorState,
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
  } = usePublicBooking(slug);

  // Scroll automático para o formulário quando aparecer
  useEffect(() => {
    if (showForm && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 300);
    }
  }, [showForm]);

  if (loading) {
    return <LoadingState />;
  }

  if (error || !client) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <PublicBookingHeader clientName={client.businessName || client.displayName} />

      <div className="max-w-4xl mx-auto px-4 -mt-20 pb-12">
        {/* Calendário */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 mb-8 backdrop-blur-sm">
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

        {/* Formulário de agendamento */}
        {showForm && selectedDate && (
          <div ref={formRef} className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-display font-bold text-gray-900">
                Novo Agendamento
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <BookingForm
              selectedDate={selectedDate}
              onSubmit={handleSubmitBooking}
              onCancel={handleCancelBooking}
              isSubmitting={creatingBooking}
              pricePerDay={client?.venueInfo?.condominiumPrice}
            />
          </div>
        )}

        {/* Informações */}
        <div className="text-center py-2 md:py-6 text-gray-600">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-gray-200/50">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium">Complete o pagamento PIX para confirmar seu agendamento.</p>
              <p className="text-xs text-gray-500 mt-0.5">A confirmação é automática após o pagamento.</p>
            </div>
          </div>
        </div>
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm mx-4 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center gap-4">
              {/* Spinner */}
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              </div>

              {/* Mensagens */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Criando agendamento...
                </h3>
                <p className="text-sm text-gray-600">
                  Gerando pagamento PIX
                </p>
              </div>

              {/* Dica */}
              <div className="text-xs text-gray-500 text-center max-w-xs">
                Aguarde enquanto preparamos seu QR Code de pagamento
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
