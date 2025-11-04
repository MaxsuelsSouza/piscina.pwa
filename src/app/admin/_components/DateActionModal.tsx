/**
 * Modal para ações em datas (bloquear/desbloquear)
 */

'use client';

import type { BlockedDate } from '@/app/(home)/_types/booking';

interface DateActionModalProps {
  selectedDate: string;
  blockedDates: BlockedDate[];
  onClose: () => void;
  onBlock: () => void;
  onUnblock: () => void;
}

export function DateActionModal({
  selectedDate,
  blockedDates,
  onClose,
  onBlock,
  onUnblock
}: DateActionModalProps) {
  const isBlocked = blockedDates.some(d => d.date === selectedDate);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-light text-gray-900 mb-2 capitalize">
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            {isBlocked ? 'Este dia está bloqueado' : 'Deseja bloquear este dia?'}
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            {isBlocked ? (
              <button
                onClick={onUnblock}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
              >
                Desbloquear
              </button>
            ) : (
              <button
                onClick={onBlock}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
              >
                Bloquear Dia
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
