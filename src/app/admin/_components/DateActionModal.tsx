/**
 * Modal para ações em datas (bloquear/desbloquear)
 */

'use client';

import { useState } from 'react';
import type { BlockedDate } from '@/app/(home)/_types/booking';

interface DateActionModalProps {
  selectedDate: string;
  blockedDates: BlockedDate[];
  onClose: () => void;
  onBlock: () => Promise<void> | void;
  onUnblock: () => Promise<void> | void;
}

export function DateActionModal({
  selectedDate,
  blockedDates,
  onClose,
  onBlock,
  onUnblock
}: DateActionModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isBlocked = blockedDates.some(d => d.date === selectedDate);

  const handleBlock = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onBlock();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await onUnblock();
    } finally {
      setIsLoading(false);
    }
  };

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
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            {isBlocked ? (
              <button
                onClick={handleUnblock}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Desbloqueando...
                  </>
                ) : (
                  'Desbloquear'
                )}
              </button>
            ) : (
              <button
                onClick={handleBlock}
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Bloqueando...
                  </>
                ) : (
                  'Bloquear Dia'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
