/**
 * Modal de detalhes do agendamento
 */

"use client";

import { cn } from '@/lib/utils';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useToast } from '@/hooks/useToast';
import type { Booking } from '../_types/booking';

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  onCancel?: (id: string) => Promise<void>;
  onConfirm?: (id: string) => Promise<void>;
  isAdmin?: boolean;
}

const PRICE_PER_DAY = 400;

export function BookingDetailsModal({ booking, onClose, onCancel, onConfirm, isAdmin }: BookingDetailsModalProps) {
  const { confirm } = useConfirm();
  const toast = useToast();

  if (!booking) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const STATUS_LABELS = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
  };

  const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: 'Cancelar Agendamento',
      message: 'Tem certeza que deseja cancelar este agendamento?',
      confirmText: 'Sim, cancelar',
      cancelText: 'Não',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        await onCancel?.(booking.id);
        toast.success('Agendamento cancelado com sucesso!');
        onClose();
      } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        toast.error('Não foi possível cancelar o agendamento. Tente novamente.');
      }
    }
  };

  const handleConfirm = async () => {
    const confirmed = await confirm({
      title: 'Confirmar Agendamento',
      message: 'Deseja confirmar este agendamento?',
      confirmText: 'Sim, confirmar',
      cancelText: 'Não',
      variant: 'info',
    });

    if (confirmed) {
      try {
        await onConfirm?.(booking.id);
        toast.success('Agendamento confirmado com sucesso!');
        onClose();
      } catch (error) {
        console.error('Erro ao confirmar agendamento:', error);
        toast.error('Não foi possível confirmar o agendamento. Tente novamente.');
      }
    }
  };

  const handleWhatsAppClick = () => {
    // Remove caracteres especiais e espaços do telefone
    const phoneNumber = booking.customerPhone.replace(/\D/g, '');
    // Abre o WhatsApp sem mensagem pré-definida
    window.open(`https://wa.me/55${phoneNumber}`, '_blank');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-lg">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes do Agendamento
                </h2>
                <p className="text-sm text-gray-600 mt-1 capitalize">
                  {formatDate(booking.date)}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4">
            {/* Status */}
            <div>
              <span
                className={cn(
                  'inline-flex px-3 py-1 rounded-full text-sm font-medium border',
                  STATUS_COLORS[booking.status]
                )}
              >
                {STATUS_LABELS[booking.status]}
              </span>
            </div>

            {/* Informações do Cliente */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Informações do Cliente</h3>

              <div>
                <label className="text-sm text-gray-600">Nome:</label>
                <p className="text-gray-900 font-medium">{booking.customerName}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Telefone:</label>
                <p className="text-gray-900 font-medium">{booking.customerPhone}</p>
              </div>

              {booking.customerEmail && (
                <div>
                  <label className="text-sm text-gray-600">Email:</label>
                  <p className="text-gray-900 font-medium break-all">{booking.customerEmail}</p>
                </div>
              )}
            </div>

            {/* Detalhes do Agendamento */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900">Detalhes do Agendamento</h3>

              <div>
                <label className="text-sm text-gray-600">Período:</label>
                <p className="text-gray-900 font-medium">Dia Inteiro (08:00 - 22:00)</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Número de pessoas:</label>
                <p className="text-gray-900 font-medium">
                  {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'pessoa' : 'pessoas'}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Valor:</label>
                <p className="text-gray-900 font-medium text-lg">
                  R$ {PRICE_PER_DAY.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {booking.notes && (
                <div>
                  <label className="text-sm text-gray-600">Observações:</label>
                  <p className="text-gray-900 mt-1 bg-gray-50 p-3 rounded border border-gray-200">
                    {booking.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Informações adicionais */}
            <div className="pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500">
                <p>Agendamento criado em: {formatDateTime(booking.createdAt)}</p>
                <p className="mt-1">ID: {booking.id}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-4 py-3 rounded-b-lg border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={onClose}
                className="flex-1 min-w-[80px] px-2 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors text-sm font-medium"
              >
                Fechar
              </button>
              <button
                onClick={handleWhatsAppClick}
                className="flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 px-2 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                title="Abrir WhatsApp"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="hidden xs:inline">WhatsApp</span>
                <span className="xs:hidden">Zap</span>
              </button>
              {booking.status === 'pending' && isAdmin && onConfirm && (
                <button
                  onClick={handleConfirm}
                  className="flex-1 min-w-[90px] px-2 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Confirmar
                </button>
              )}
              {booking.status === 'pending' && onCancel && (
                <button
                  onClick={handleCancel}
                  className="flex-1 min-w-[90px] px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
