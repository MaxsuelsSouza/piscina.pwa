/**
 * Página pública de agendamento
 */

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookingCalendar } from './(home)/_components/BookingCalendar';
import { BookingForm } from './(home)/_components/BookingForm';
import type { Booking, BlockedDate } from './(home)/_types/booking';
import {
  createBooking,
  onBookingsChange,
  onBlockedDatesChange,
} from '@/services/bookings.service';

const WHATSAPP_NUMBER = '5581997339707';

export default function PublicBookingPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Carrega agendamentos e datas bloqueadas do Firestore em tempo real
  useEffect(() => {
    console.log('📡 Conectando ao Firestore para sincronização em tempo real...');

    // Escuta mudanças nos agendamentos
    const unsubscribeBookings = onBookingsChange((newBookings) => {
      // Filtra agendamentos expirados
      const now = new Date().toISOString();
      const validBookings = newBookings.filter((b) => {
        if (b.status === 'pending' && b.expiresAt && b.expiresAt < now) {
          return false;
        }
        return true;
      });
      setBookings(validBookings);
    });

    // Escuta mudanças nas datas bloqueadas
    const unsubscribeBlockedDates = onBlockedDatesChange((dates) => {
      setBlockedDates(dates);
    });

    // Cleanup: desconecta ao desmontar o componente
    return () => {
      console.log('🔌 Desconectando do Firestore...');
      unsubscribeBookings();
      unsubscribeBlockedDates();
    };
  }, []);


  const handleSelectDate = (date: string) => {
    // Verifica se o dia já está ocupado
    const isOccupied = activeBookings.some(b => b.date === date);
    if (isOccupied) {
      alert('Este dia já está ocupado. Por favor, escolha outro dia.');
      return;
    }

    // Verifica se o dia está bloqueado
    const isBlocked = blockedDates.some(bd => bd.date === date);
    if (isBlocked) {
      alert('Este dia está bloqueado e não pode ser agendado.');
      return;
    }

    setSelectedDates(prev => {
      if (prev.includes(date)) {
        return prev.filter(d => d !== date);
      } else {
        if (prev.length >= 3) {
          alert('Você só pode agendar no máximo 3 dias por vez.');
          return prev;
        }
        return [...prev, date];
      }
    });
    setShowBookingForm(false);
  };

  const handleConfirmDates = () => {
    if (selectedDates.length === 0) {
      alert('Selecione pelo menos um dia para agendar.');
      return;
    }

    // Validação final: verifica se algum dia selecionado está ocupado ou bloqueado
    const occupiedDates = selectedDates.filter(date =>
      activeBookings.some(b => b.date === date)
    );
    const blockedDatesSelected = selectedDates.filter(date =>
      blockedDates.some(bd => bd.date === date)
    );

    if (occupiedDates.length > 0) {
      alert('Um ou mais dias selecionados já estão ocupados. Por favor, remova-os da seleção.');
      return;
    }

    if (blockedDatesSelected.length > 0) {
      alert('Um ou mais dias selecionados estão bloqueados. Por favor, remova-os da seleção.');
      return;
    }

    setShowBookingForm(true);
  };

  const handleSubmitBooking = async (formData: any) => {
    // Validação final antes de criar o agendamento
    const occupiedDates = selectedDates.filter(date =>
      bookings.some(b => b.date === date && b.status !== 'cancelled')
    );

    if (occupiedDates.length > 0) {
      alert('Erro: Um ou mais dias já foram agendados por outra pessoa. Por favor, recarregue a página e tente novamente.');
      return;
    }

    try {
      console.log('💾 Salvando agendamentos no Firestore...');

      // Cria agendamento para cada dia selecionado
      const bookingPromises = selectedDates.map(async (date) => {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // +1 hora

        const bookingData = {
          date,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerEmail: formData.customerEmail,
          timeSlot: 'full-day',
          numberOfPeople: formData.numberOfPeople,
          status: 'pending' as const,
          notes: formData.notes,
          createdAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          expirationNotificationSent: false,
        };

        const id = await createBooking(bookingData);
        return { id, ...bookingData };
      });

      const newBookings = await Promise.all(bookingPromises);
      console.log('✅ Agendamentos salvos com sucesso!');

      // Cria mensagem para WhatsApp
      const bookingIds = newBookings.map(b => b.id).join(', ');
      const dates = selectedDates.map(d => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')).join(', ');
      const message = encodeURIComponent(
        `Comprovante do agendamento:\n\nNome: ${formData.customerName}\nTelefone: ${formData.customerPhone}\nDias: ${dates}\nPessoas: ${formData.numberOfPeople}\nID: ${bookingIds}\n\n*Este agendamento expira em 1 hora e precisa ser confirmado.*`
      );

      // Redireciona para WhatsApp
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');

      // Reseta seleção
      setSelectedDates([]);
      setShowBookingForm(false);

      alert('Agendamento realizado! Você será redirecionado para o WhatsApp para confirmar.');
    } catch (error) {
      console.error('❌ Erro ao criar agendamento:', error);
      alert('Erro ao criar agendamento. Por favor, tente novamente.');
    }
  };

  const handleCancelBooking = () => {
    setShowBookingForm(false);
    setSelectedDates([]);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Filtra apenas agendamentos confirmados ou pendentes não expirados
  const activeBookings = bookings.filter(b => {
    if (b.status === 'cancelled') return false;
    if (b.status === 'confirmed') return true;
    if (b.status === 'pending' && b.expiresAt) {
      return new Date(b.expiresAt) > new Date();
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 pt-16 pb-32">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-light text-white mb-3 tracking-tight">
            Agendamento
          </h1>
          <p className="text-blue-100 text-lg font-light">
            Reserve seu dia na piscina
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 -mt-24">
        {/* Calendar Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Navigation */}
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <h2 className="text-lg font-medium text-gray-900">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>

            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-50 rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar */}
          <div className="p-6">
            <BookingCalendar
              currentDate={currentDate}
              bookings={activeBookings}
              selectedDates={selectedDates}
              onSelectDate={handleSelectDate}
              multiSelectMode={true}
              blockedDates={blockedDates}
            />
          </div>

          {/* Action Button */}
          {selectedDates.length > 0 && !showBookingForm && (
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={handleConfirmDates}
                className="w-full py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-medium text-base shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
              >
                Continuar com {selectedDates.length} {selectedDates.length === 1 ? 'dia' : 'dias'}
              </button>
            </div>
          )}
        </div>

        {/* Booking Form */}
        {showBookingForm && (
          <div className="mt-8 mb-8 animate-fadeIn">
            <BookingForm
              selectedDate={selectedDates[0]}
              numberOfDays={selectedDates.length}
              onSubmit={handleSubmitBooking}
              onCancel={handleCancelBooking}
            />
          </div>
        )}

        {/* Admin Link */}
        <div className="py-12 text-center">
          <button
            onClick={() => router.push('/admin')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors font-light"
          >
            Acesso administrativo
          </button>
        </div>
      </div>
    </div>
  );
}
