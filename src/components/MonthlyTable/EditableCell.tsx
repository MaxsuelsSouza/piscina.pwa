/**
 * EditableCell Component
 * Célula editável para valores de entrada/saída
 */

import { useState, useEffect, useRef } from 'react';
import { formatarBRL } from './utils';

interface EditableCellProps {
  value: number;
  onSave: (value: number) => void;
  variant: 'entrada' | 'saida';
  maxValue: number;
  date: string;
  onOpenDescriptionModal?: (value: number, variant: 'entrada' | 'saida') => void;
}

export function EditableCell({ value, onSave, variant, maxValue, date, onOpenDescriptionModal }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const barWidth = value ? Math.min((value / maxValue) * 100, 100) : 0;

  const colors = {
    entrada: {
      bar: 'bg-green-500/70',
      text: 'text-gray-900',
      focus: 'focus:border-blue-500',
    },
    saida: {
      bar: 'bg-red-400/70',
      text: 'text-gray-900',
      focus: 'focus:border-blue-500',
    },
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const numValue = parseFloat(editValue.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    onSave(numValue);
    setIsEditing(false);

    // Abre o modal de descrição se houver valor e callback
    if (numValue > 0 && onOpenDescriptionModal) {
      onOpenDescriptionModal(numValue, variant);
    }
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (value === 0 && !isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex-1 flex items-center justify-start"
        title="Clique para adicionar valor"
      >
        <span className="text-gray-300 text-xs">+</span>
      </button>
    );
  }

  if (isEditing) {
    return (
      <div className="flex-1 flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={`flex-1 px-1 py-0.5 bg-white border border-gray-300 ${colors[variant].focus} text-gray-900 text-xs outline-none`}
          placeholder="0.00"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex-1 flex items-center justify-start"
      title="Clique para editar"
    >
      <span className={`${colors[variant].text} text-xs font-mono`}>
        {formatarBRL(value)}
      </span>
    </button>
  );
}
