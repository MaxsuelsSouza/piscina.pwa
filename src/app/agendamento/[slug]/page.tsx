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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <PublicBookingHeader clientName={client.displayName} />

      <div className="max-w-4xl mx-auto px-4 -mt-16">
        {/* Calendário */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
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
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Novo Agendamento
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
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
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>Os agendamentos ficam pendentes até serem confirmados.</p>
          <p className="mt-2">Você receberá uma confirmação em breve.</p>
        </div>
      </div>
    </div>
  );
}
