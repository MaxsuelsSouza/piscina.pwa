/**
 * Fluxo de agendamento para barbearias
 * Passos: Dia → Profissional → Serviços → Horário → Dados do cliente
 */

'use client';

import { useState, useEffect } from 'react';
import type { Professional, Service, BookedService } from '@/types/barbershop';
import { calculateAvailableTimeSlots } from '../_utils/timeSlots';

interface BarbershopBookingFlowProps {
  selectedDate: string;
  professionals: Professional[];
  services: Service[];
  existingBookings: any[]; // ServiceBooking[]
  schedule: any; // BarberSchedule
  onSubmit: (data: {
    professionalId: string;
    services: BookedService[];
    startTime: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  onDateChange?: (date: string) => void;
}

export function BarbershopBookingFlow({
  selectedDate,
  professionals,
  services,
  existingBookings,
  schedule,
  onSubmit,
  onCancel,
  isSubmitting,
  onDateChange,
}: BarbershopBookingFlowProps) {
  const STORAGE_KEY = `barbershop-booking-${selectedDate}`;
  const EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutos em ms

  const [step, setStep] = useState<'services' | 'professional' | 'time' | 'customer'>('services');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Dados do cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  // Carrega dados salvos do localStorage ao montar
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        const now = Date.now();

        // Verifica se não expirou (15 minutos)
        if (parsed.timestamp && now - parsed.timestamp < EXPIRATION_TIME) {
          // Restaura os dados
          if (parsed.professionalId) {
            const prof = professionals.find(p => p.id === parsed.professionalId);
            if (prof) setSelectedProfessional(prof);
          }
          if (parsed.serviceIds && Array.isArray(parsed.serviceIds)) {
            const selectedSvcs = services.filter(s => parsed.serviceIds.includes(s.id));
            setSelectedServices(selectedSvcs);
          }
          if (parsed.time) setSelectedTime(parsed.time);
          if (parsed.customerName) setCustomerName(parsed.customerName);
          if (parsed.customerPhone) setCustomerPhone(parsed.customerPhone);
          if (parsed.customerEmail) setCustomerEmail(parsed.customerEmail);
          if (parsed.notes) setNotes(parsed.notes);
          if (parsed.step) setStep(parsed.step);
        } else {
          // Expirou, remove do localStorage
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Erro ao carregar dados salvos:', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [selectedDate, professionals, services, STORAGE_KEY, EXPIRATION_TIME]);

  // Salva dados no localStorage sempre que mudarem
  useEffect(() => {
    const dataToSave = {
      timestamp: Date.now(),
      step,
      professionalId: selectedProfessional?.id,
      serviceIds: selectedServices.map(s => s.id),
      time: selectedTime,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }, [
    step,
    selectedProfessional,
    selectedServices,
    selectedTime,
    customerName,
    customerPhone,
    customerEmail,
    notes,
    STORAGE_KEY,
  ]);

  // Limpa dados salvos
  const clearSavedData = () => {
    localStorage.removeItem(STORAGE_KEY);
  };

  // Filtra apenas profissionais ativos e ordena por mais escolhidos
  const activeProfessionals = professionals
    .filter(p => p.isActive)
    .sort((a, b) => {
      // Conta quantos agendamentos cada profissional tem
      const countA = existingBookings.filter(booking =>
        booking.professionalId === a.id && booking.status !== 'cancelled'
      ).length;
      const countB = existingBookings.filter(booking =>
        booking.professionalId === b.id && booking.status !== 'cancelled'
      ).length;

      // Ordena do maior para o menor (mais agendamentos primeiro)
      return countB - countA;
    });

  // Todos os serviços ativos (não filtra por profissional)
  const availableServices = services.filter(s => s.isActive);

  // Calcula duração total e preço total dos serviços selecionados
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);

  // Handlers
  const handleToggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    setSelectedTime(''); // Reset time quando mudar serviços
  };

  const handleContinueToProfessional = () => {
    if (selectedServices.length === 0) return;
    setStep('professional');
  };

  const handleSelectProfessional = (professional: Professional) => {
    setSelectedProfessional(professional);
    setSelectedTime('');
    // Não muda de step - permanece na tela de profissionais
  };

  const handleSelectTime = (time: string) => {
    setSelectedTime(time);
  };

  const handleContinueToCustomer = () => {
    if (!selectedTime || !selectedProfessional) return;
    setStep('customer');
  };

  const handleNavigateDate = (direction: 'prev' | 'next') => {
    const currentDateObj = new Date(selectedDate);
    const newDate = new Date(currentDateObj);

    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
      // Não permite voltar para datas anteriores ao dia atual
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (newDate < today) return;
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }

    const formattedDate = newDate.toISOString().split('T')[0];
    if (onDateChange) {
      onDateChange(formattedDate);
    }
    setSelectedTime(''); // Reset time quando mudar data
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfessional || selectedServices.length === 0 || !selectedTime) return;

    const bookedServices: BookedService[] = selectedServices.map(s => ({
      serviceId: s.id,
      serviceName: s.name,
      duration: s.duration,
      price: s.price,
    }));

    onSubmit({
      professionalId: selectedProfessional.id,
      services: bookedServices,
      startTime: selectedTime,
      customerName,
      customerPhone,
      customerEmail,
      notes,
    });

    // Limpa dados salvos após submissão
    clearSavedData();
  };

  const handleCancelBooking = () => {
    // Limpa dados salvos ao cancelar
    clearSavedData();
    onCancel();
  };

  const handleBack = () => {
    if (step === 'professional') setStep('services');
    else if (step === 'customer') setStep('professional');
  };

  return (
    <div className="space-y-6">
      {/* Progress bar minimalista */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-0 flex-1">
          {[1, 2, 3].map((num, index) => {
            const stepNames = ['services', 'professional', 'customer'];
            const currentIndex = stepNames.indexOf(step);
            const isCompleted = currentIndex >= num - 1;
            const isActive = currentIndex === num - 1;

            return (
              <>
                {/* Step number */}
                <div
                  key={num}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all flex-shrink-0 ${
                    isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/30' :
                    isCompleted ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-400'
                  }`}
                >
                  {isCompleted && !isActive ? '✓' : num}
                </div>

                {/* Progress line (não mostrar depois do último) */}
                {index < 2 && (
                  <div className={`h-1 flex-1 mx-2 rounded-full transition-all ${
                    currentIndex >= num ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </>
            );
          })}
        </div>

        {step !== 'services' && (
          <button
            type="button"
            onClick={handleBack}
            className="ml-4 text-sm text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Voltar</span>
          </button>
        )}
      </div>

      {/* Conteúdo por etapa */}
      {step === 'services' && (
        <div>
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Escolha os serviços
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Selecione um ou mais serviços para continuar
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {availableServices.map(service => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              return (
                <button
                  key={service.id}
                  onClick={() => handleToggleService(service)}
                  className={`group w-full p-4 border rounded-xl text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-sm bg-white dark:bg-gray-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Lado esquerdo: Checkbox + Informações */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className={`mt-1 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-gray-100 text-base mb-1">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-200 mb-2 line-clamp-2">
                            {service.description}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{service.duration} minutos</span>
                        </div>
                      </div>
                    </div>

                    {/* Lado direito: Preço */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedServices.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-200">Total</div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-200">Duração</div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {totalDuration} min
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleContinueToProfessional}
            disabled={selectedServices.length === 0}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
          >
            Continuar
          </button>
        </div>
      )}

      {step === 'professional' && (
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Escolha o profissional
          </h3>

          {/* Grid de profissionais */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 mb-6">
            {activeProfessionals.map(prof => {
              const isSelected = selectedProfessional?.id === prof.id;
              return (
                <button
                  key={prof.id}
                  onClick={() => handleSelectProfessional(prof)}
                  className={`group flex flex-col items-center transition-all ${
                    isSelected ? 'opacity-100' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Foto ou placeholder */}
                  <div className={`relative w-16 h-16 mb-2 ${
                    isSelected ? 'ring-4 ring-blue-500 rounded-full' : ''
                  }`}>
                    {prof.photo ? (
                      <img
                        src={prof.photo}
                        alt={prof.name}
                        className="w-full h-full rounded-full object-cover shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-200"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-200">
                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-400 group-hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Nome */}
                  <div className="text-center w-full">
                    <div className={`font-medium transition-colors text-xs line-clamp-2 px-1 ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600'
                    }`}>
                      {prof.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {activeProfessionals.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-300">Nenhum profissional disponível no momento.</p>
            </div>
          )}

          {/* Card de horários - aparece abaixo quando um profissional é selecionado */}
          {selectedProfessional && (
            <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              {/* Header com data e setas */}
              <div className="flex items-center justify-between mb-6">
                <button
                  type="button"
                  onClick={() => handleNavigateDate('prev')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Data anterior"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(selectedDate).toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long'
                    })}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                    Profissional: {selectedProfessional.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleNavigateDate('next')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Próxima data"
                >
                  <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Seletor de horários */}
              <TimeSlotSelector
                selectedDate={selectedDate}
                professionalId={selectedProfessional.id}
                totalDuration={totalDuration}
                existingBookings={existingBookings}
                schedule={schedule}
                allServices={services}
                professionals={professionals}
                onSelectTime={handleSelectTime}
                selectedTime={selectedTime}
              />

              {/* Botão continuar - aparece quando um horário é selecionado */}
              {selectedTime && (
                <div className="mt-6">
                  <button
                    onClick={handleContinueToCustomer}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30"
                  >
                    Continuar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {step === 'customer' && (
        <form onSubmit={handleSubmitBooking} className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Seus dados
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300">Preencha suas informações para confirmar</p>
          </div>

          {/* Resumo minimalista */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-200">Profissional</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{selectedProfessional?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-200">Serviços</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 text-right">{selectedServices.map(s => s.name).join(', ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-200">Horário</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTime}</span>
            </div>
            <div className="pt-2 border-t border-gray-300 dark:border-gray-600 flex justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Total</span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nome completo *
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Telefone/WhatsApp *
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Email (opcional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Observações (opcional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 transition-all resize-none"
                placeholder="Alguma observação ou pedido especial..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancelBooking}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:shadow-none"
            >
              {isSubmitting ? 'Agendando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// Componente para selecionar horário
function TimeSlotSelector({
  selectedDate,
  professionalId,
  totalDuration,
  existingBookings,
  schedule,
  allServices,
  professionals,
  onSelectTime,
  selectedTime,
}: {
  selectedDate: string;
  professionalId: string;
  totalDuration: number;
  existingBookings: any[];
  schedule: any;
  allServices: Service[];
  professionals: Professional[];
  onSelectTime: (time: string) => void;
  selectedTime?: string;
}) {
  const availableSlots = calculateAvailableTimeSlots(
    selectedDate,
    professionalId,
    totalDuration,
    existingBookings,
    schedule,
    allServices,
    professionals
  );

  if (availableSlots.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-200 font-medium">Nenhum horário disponível</p>
        <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">Tente outro dia ou profissional</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {availableSlots.map(slot => {
        const isSelected = selectedTime === slot;
        return (
          <button
            key={slot}
            onClick={() => onSelectTime(slot)}
            className={`group p-3 border rounded-lg transition-all text-center ${
              isSelected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
            }`}
          >
            <div className={`text-sm font-medium ${
              isSelected
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-900 dark:text-gray-100 group-hover:text-blue-600'
            }`}>
              {slot}
            </div>
          </button>
        );
      })}
    </div>
  );
}

