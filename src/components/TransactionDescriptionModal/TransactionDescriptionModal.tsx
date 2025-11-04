/**
 * TransactionDescriptionModal Component
 * Modal para adicionar descrição a uma transação
 */

"use client";

import { useState, useEffect } from 'react';
import { Modal } from '@/components/Modal';

interface TransactionDescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => void;
  initialDescription?: string;
  type: 'entrada' | 'saida';
  value: number;
  date: string;
}

export function TransactionDescriptionModal({
  isOpen,
  onClose,
  onSave,
  initialDescription = '',
  type,
  value,
  date,
}: TransactionDescriptionModalProps) {
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (isOpen) {
      setDescription(initialDescription);
    }
  }, [isOpen, initialDescription]);

  const handleSave = () => {
    onSave(description);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Descrição do gasto" size="md">
      <div className="space-y-4">
        {/* Informações da transação */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Tipo:</span>
            <span className={`text-sm font-medium ${type === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
              {type === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Valor:</span>
            <span className="text-sm font-semibold text-gray-900">{formattedValue}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Data:</span>
            <span className="text-sm text-gray-900 capitalize">{formattedDate}</span>
          </div>
        </div>

        {/* Campo de descrição */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descrição
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Compra no mercado, Salário, Pagamento de conta..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
            rows={4}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Pressione Enter para salvar ou Shift+Enter para quebrar linha
          </p>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
}
