/**
 * MonthColumn Component
 * Coluna de um mês individual (exibida lado a lado com outros meses)
 */

import { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatarBRL, getSaldoColor } from './utils';
import { EditableCell } from './EditableCell';
import { TransactionDescriptionModal } from '@/components/TransactionDescriptionModal';
import type { MonthData, DayData } from './types';

interface MonthColumnProps {
  monthData: MonthData;
  onDayClick: (date: string, data: any) => void;
  onValueChange: (date: string, type: 'entrada' | 'saida', value: number) => void;
  maxSaida: number;
}

export const MonthColumn = memo(function MonthColumn({
  monthData,
  onDayClick,
  onValueChange,
  maxSaida,
}: MonthColumnProps) {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    date: string;
    type: 'entrada' | 'saida';
    value: number;
  }>({
    isOpen: false,
    date: '',
    type: 'entrada',
    value: 0,
  });

  const handleValueChange = useCallback(
    (date: string, type: 'entrada' | 'saida', value: number) => {
      onValueChange(date, type, value);
    },
    [onValueChange]
  );

  const handleOpenDescriptionModal = useCallback(
    (date: string) => (value: number, type: 'entrada' | 'saida') => {
      setModalState({
        isOpen: true,
        date,
        type,
        value,
      });
    },
    []
  );

  const handleSaveDescription = useCallback(
    (description: string) => {
      console.log('Descrição salva:', {
        date: modalState.date,
        type: modalState.type,
        value: modalState.value,
        description,
      });
      // TODO: Salvar descrição no backend/estado
    },
    [modalState]
  );

  const handleCloseModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return (
    <div className="flex-1 min-w-[400px] border-r border-gray-200 last:border-r-0">
      {/* Header do Mês */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-2 py-1.5 z-10">
        <h3 className="text-sm font-semibold text-gray-900 text-center capitalize">
          {monthData.name.split(' ')[0]}
        </h3>
      </div>

      {/* Cabeçalho das Colunas */}
      <div className="sticky top-[38px] bg-white border-b border-gray-200 px-1 py-2 grid grid-cols-4 gap-1 text-xs z-10">
        <div className="text-center">
          <span className="font-medium text-gray-700">Data</span>
        </div>
        <div className="text-left">
          <span className="font-medium text-gray-700">Entrada</span>
        </div>
        <div className="text-left">
          <span className="font-medium text-gray-700">Saída</span>
        </div>
        <div className="text-right pr-2">
          <span className="font-medium text-gray-700">Saldo</span>
        </div>
      </div>

      {/* Dias */}
      <div className="pt-2">
        {monthData.daysData.map((dayData) => {
          const saldoDiario =
            (dayData.registro?.entrada || 0) - (dayData.registro?.saida || 0);
          const hasData = dayData.registro && (dayData.registro.entrada > 0 || dayData.registro.saida > 0);

          // Calcula larguras das barras
          const saidaBarWidth = dayData.registro?.saida
            ? Math.min((dayData.registro.saida / maxSaida) * 100, 100)
            : 0;
          const entradaBarWidth = dayData.registro?.entrada
            ? Math.min((dayData.registro.entrada / maxSaida) * 100, 100)
            : 0;

          return (
            <div
              key={dayData.date}
              className={cn(
                'grid grid-cols-4 gap-1 px-1 py-0.5 border-b border-gray-100'
              )}
            >
              {/* Data */}
              <div className="flex items-center justify-center">
                <span className="text-gray-900 text-xs font-medium">{dayData.day}</span>
              </div>

              {/* Entrada - Editável */}
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <EditableCell
                  value={dayData.registro?.entrada || 0}
                  onSave={(value) => handleValueChange(dayData.date, 'entrada', value)}
                  variant="entrada"
                  maxValue={maxSaida}
                  date={dayData.date}
                  onOpenDescriptionModal={handleOpenDescriptionModal(dayData.date)}
                />
              </div>

              {/* Saída - Editável */}
              <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                <EditableCell
                  value={dayData.registro?.saida || 0}
                  onSave={(value) => handleValueChange(dayData.date, 'saida', value)}
                  variant="saida"
                  maxValue={maxSaida}
                  date={dayData.date}
                  onOpenDescriptionModal={handleOpenDescriptionModal(dayData.date)}
                />
              </div>

              {/* Saldo */}
              <div className="flex items-center justify-end pr-2">
                <span className={cn('text-xs font-mono font-bold', getSaldoColor(dayData.saldo))}>
                  {formatarBRL(dayData.saldo)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de descrição */}
      <TransactionDescriptionModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSave={handleSaveDescription}
        type={modalState.type}
        value={modalState.value}
        date={modalState.date}
      />
    </div>
  );
});
