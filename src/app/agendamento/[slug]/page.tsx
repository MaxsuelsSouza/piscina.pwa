'use client';

/**
 * Página pública de agendamento para um cliente específico
 * URL: /agendamento/[slug]
 */

import { useParams } from 'next/navigation';
import { BookingCalendar } from '@/app/(home)/_components/BookingCalendar';
import { BookingForm } from '@/app/(home)/_components/BookingForm';
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

  const {
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
  } = usePublicBooking(slug);

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
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
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
            />
          </div>
        )}

        {/* Informações */}
        <div className="text-center py-10 text-gray-600">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-sm border border-gray-200/50">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium">Os agendamentos ficam pendentes até serem confirmados.</p>
              <p className="text-xs text-gray-500 mt-0.5">Você receberá uma confirmação em breve.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
