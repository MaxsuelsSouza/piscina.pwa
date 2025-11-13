/**
 * Formulário para criar novo agendamento
 */

"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import type { TimeSlot, TimeSlotInfo } from '../_types/booking';
import {
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizeNotes,
  sanitizeNumberOfPeople,
  sanitizeBookingFormData,
} from '@/lib/security/input-sanitizer';

interface BookingFormProps {
  selectedDate: string;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
  numberOfDays?: number;
}

export interface BookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  timeSlot: TimeSlot;
  numberOfPeople: number;
  notes: string;
}

const TIME_SLOTS: TimeSlotInfo[] = [
  { id: 'morning', label: 'Manhã', time: '08:00 - 12:00', price: 150 },
  { id: 'afternoon', label: 'Tarde', time: '13:00 - 17:00', price: 150 },
  { id: 'evening', label: 'Noite', time: '18:00 - 22:00', price: 200 },
  { id: 'full-day', label: 'Dia Inteiro', time: '08:00 - 22:00', price: 400 },
];

export function BookingForm({
  selectedDate,
  onSubmit,
  onCancel,
  numberOfDays = 1,
}: BookingFormProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    timeSlot: 'full-day',
    numberOfPeople: 1,
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BookingFormData, string>>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validate = () => {
    const { isValid, errors: validationErrors } = sanitizeBookingFormData(formData);
    setErrors(validationErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid } = sanitizeBookingFormData(formData);

    if (isValid) {
      // Mostra modal de confirmação ao invés de submeter direto
      setShowConfirmModal(true);
    }
  };

  const handleConfirmBooking = () => {
    const { sanitizedData } = sanitizeBookingFormData(formData);

    // Envia dados sanitizados
    onSubmit({
      ...formData,
      customerName: sanitizedData.customerName,
      customerPhone: sanitizedData.customerPhone,
      customerEmail: sanitizedData.customerEmail,
      numberOfPeople: sanitizedData.numberOfPeople,
      notes: sanitizedData.notes,
    });

    setShowConfirmModal(false);
  };

  const handleCancelModal = () => {
    setShowConfirmModal(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Preço fixo para dia inteiro
  const PRICE_PER_DAY = 400;
  const totalPrice = PRICE_PER_DAY * numberOfDays;

  return (
    <>
      <h3 className="text-2xl font-light text-gray-900 mb-2">
        Complete seus dados
      </h3>
      <p className="text-sm text-gray-500 mb-8 font-light capitalize">
        {formatDate(selectedDate)}
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nome */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Nome completo
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: sanitizeName(e.target.value) })}
            className={cn(
              'w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all',
              errors.customerName
                ? 'ring-2 ring-red-500'
                : 'focus:ring-blue-500'
            )}
            placeholder="Seu nome"
          />
          {errors.customerName && (
            <p className="text-xs text-red-600 mt-2">{errors.customerName}</p>
          )}
        </div>

        {/* Telefone */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Telefone
          </label>
          <input
            type="tel"
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: sanitizePhone(e.target.value) })}
            className={cn(
              'w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all',
              errors.customerPhone
                ? 'ring-2 ring-red-500'
                : 'focus:ring-blue-500'
            )}
            placeholder="(00) 00000-0000"
          />
          {errors.customerPhone && (
            <p className="text-xs text-red-600 mt-2">{errors.customerPhone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Email <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: sanitizeEmail(e.target.value) })}
            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            placeholder="seu@email.com"
          />
        </div>

        {/* Número de pessoas */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Número de pessoas
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={formData.numberOfPeople}
            onChange={(e) => setFormData({ ...formData, numberOfPeople: sanitizeNumberOfPeople(parseInt(e.target.value)) })}
            className={cn(
              'w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all',
              errors.numberOfPeople
                ? 'ring-2 ring-red-500'
                : 'focus:ring-blue-500'
            )}
          />
          {errors.numberOfPeople && (
            <p className="text-xs text-red-600 mt-2">{errors.numberOfPeople}</p>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
            Observações <span className="text-gray-400">(opcional)</span>
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: sanitizeNotes(e.target.value) })}
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            placeholder="Alguma informação adicional..."
          />
        </div>

        {/* Total */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 mt-8">
          {numberOfDays > 1 && (
            <div className="mb-4 pb-4 border-b border-blue-200">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600 font-light">Valor por dia</span>
                <span className="font-medium text-gray-900">R$ {PRICE_PER_DAY.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 font-light">Quantidade de dias</span>
                <span className="font-medium text-gray-900">× {numberOfDays}</span>
              </div>
            </div>
          )}
          <div className="flex justify-between items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-2xl sm:text-3xl font-light text-blue-700 whitespace-nowrap ml-auto">
              R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-4 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium"
          >
            Voltar
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
          >
            Confirmar
          </button>
        </div>
      </form>

      {/* Modal de Confirmação - Renderizado via Portal */}
      {mounted && showConfirmModal && createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in zoom-in-95 duration-200">
            {/* Ícone de Aviso */}
            <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            {/* Título */}
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center mb-3">
              Agendamento Pendente
            </h3>

            {/* Descrição */}
            <div className="space-y-3 mb-6">
              <p className="text-sm sm:text-base text-gray-600 text-center">
                Seu agendamento ficará <span className="font-semibold text-yellow-600">pendente</span> até o envio do comprovante de pagamento.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">Próximos passos:</p>
                    <ol className="list-decimal list-inside space-y-1 text-blue-800">
                      <li>Envie o comprovante via WhatsApp</li>
                      <li>Aguarde a confirmação do proprietário</li>
                      <li>Seu agendamento será confirmado!</li>
                    </ol>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Você será redirecionado para o WhatsApp para enviar o comprovante
              </p>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleCancelModal}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBooking}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-medium shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Enviar Comprovante
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
