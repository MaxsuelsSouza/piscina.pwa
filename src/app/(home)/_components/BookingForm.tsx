/**
 * Formulário para criar novo agendamento
 */

"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TimeSlot, TimeSlotInfo } from '../_types/booking';
import {
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizeNotes,
  sanitizeBookingFormData,
} from '@/lib/security/input-sanitizer';

interface BookingFormProps {
  selectedDate: string;
  onSubmit: (data: BookingFormData) => void;
  onCancel: () => void;
  numberOfDays?: number;
  isSubmitting?: boolean;
  pricePerDay?: number; // Valor por dia configurado no perfil
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
  isSubmitting = false,
  pricePerDay,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, sanitizedData, errors: validationErrors } = sanitizeBookingFormData(formData);

    if (isValid) {
      // Envia dados sanitizados direto
      onSubmit({
        ...formData,
        customerName: sanitizedData.customerName,
        customerPhone: sanitizedData.customerPhone,
        customerEmail: sanitizedData.customerEmail,
        notes: sanitizedData.notes,
      });
    } else {
      // Mostra erros de validação
      setErrors(validationErrors);
    }
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

  // Usa o valor configurado no perfil ou valor padrão
  const PRICE_PER_DAY = pricePerDay ?? 0.01;
  const totalPrice = PRICE_PER_DAY * numberOfDays;

  // Verifica se os campos obrigatórios estão preenchidos
  const isFormValid = formData.customerName.trim().length > 0 &&
                      formData.customerPhone.trim().length > 0;

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
            Nome completo <span className="text-red-500">*</span>
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
            Telefone <span className="text-red-500">*</span>
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
            disabled={isSubmitting}
            className="flex-1 px-6 py-4 rounded-xl text-gray-600 hover:bg-gray-50 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isFormValid}
            className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processando...
              </>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </form>
    </>
  );
}
