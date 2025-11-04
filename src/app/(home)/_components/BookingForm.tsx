/**
 * Formulário para criar novo agendamento
 */

"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { TimeSlot, TimeSlotInfo } from '../_types/booking';

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

  const validate = () => {
    const newErrors: Partial<Record<keyof BookingFormData, string>> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Nome é obrigatório';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Telefone é obrigatório';
    }

    if (formData.numberOfPeople < 1) {
      newErrors.numberOfPeople = 'Mínimo 1 pessoa';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
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

  // Preço fixo para dia inteiro
  const PRICE_PER_DAY = 400;
  const totalPrice = PRICE_PER_DAY * numberOfDays;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
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
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
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
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
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
            max="50"
            value={formData.numberOfPeople}
            onChange={(e) => setFormData({ ...formData, numberOfPeople: parseInt(e.target.value) || 1 })}
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
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
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
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Total</span>
            <span className="text-3xl font-light text-blue-700">
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
    </div>
  );
}
