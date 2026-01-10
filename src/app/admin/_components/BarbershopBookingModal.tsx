/**
 * Modal de detalhes de agendamento de barbearia
 */

'use client';

import type { ServiceBooking } from '@/types/barbershop';

interface BarbershopBookingModalProps {
  booking: ServiceBooking;
  onClose: () => void;
  onConfirm?: (bookingId: string) => Promise<void>;
  onCancel?: (bookingId: string) => Promise<void>;
  onComplete?: (bookingId: string) => Promise<void>;
  isProcessing?: boolean;
}

export function BarbershopBookingModal({
  booking,
  onClose,
  onConfirm,
  onCancel,
  onComplete,
  isProcessing = false,
}: BarbershopBookingModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'completed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'pending': return 'Pendente';
      case 'completed': return 'Concluído';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Detalhes do Agendamento</h3>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-center">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusLabel(booking.status)}
            </span>
          </div>

          {/* Data e Horário */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Data</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {new Date(booking.date + 'T00:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Horário</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {booking.startTime} - {booking.endTime}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {booking.totalDuration} minutos
                </p>
              </div>
            </div>
          </div>

          {/* Profissional */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Profissional</p>
            <p className="text-gray-900 dark:text-gray-100 font-medium">{booking.professionalName}</p>
          </div>

          {/* Serviços */}
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Serviços</p>
            <div className="space-y-2">
              {booking.services.map((service, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{service.serviceName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{service.duration} minutos</p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    R$ {service.price.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              R$ {booking.totalPrice.toFixed(2)}
            </p>
          </div>

          {/* Cliente */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{booking.customerName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Telefone</p>
              <p className="text-gray-900 dark:text-gray-100 font-medium">{booking.customerPhone}</p>
            </div>
            {booking.customerEmail && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{booking.customerEmail}</p>
              </div>
            )}
            {booking.notes && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Observações</p>
                <p className="text-gray-900 dark:text-gray-100 italic">"{booking.notes}"</p>
              </div>
            )}
          </div>

          {/* Informações adicionais */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Criado em</p>
            <p className="text-gray-900 dark:text-gray-100">
              {new Date(booking.createdAt).toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Footer com ações */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-4 rounded-b-2xl">
          <div className="flex gap-3">
            {booking.status === 'pending' && onConfirm && (
              <button
                onClick={() => onConfirm(booking.id)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar
              </button>
            )}

            {booking.status === 'confirmed' && onComplete && (
              <button
                onClick={() => onComplete(booking.id)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Marcar como Concluído
              </button>
            )}

            {(booking.status === 'pending' || booking.status === 'confirmed') && onCancel && (
              <button
                onClick={() => onCancel(booking.id)}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
