/**
 * MonthlyTableList Component
 * Visualização em lista vertical dos dias (tabela)
 */

"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useMemo,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { MonthColumn } from './MonthColumn';
import {
  generateMonthsFromCreation,
  calculateMonthBalance,
  calculateBalanceUntilDate,
  daysInMonth,
} from './utils';
import type {
  MonthlyTableHandle,
  MonthlyTableProps,
  MonthData,
  DayData,
} from './types';

const MonthlyTableList = forwardRef<MonthlyTableHandle, MonthlyTableProps>(
  function MonthlyTableList(
    {
      registros,
      onUpdated,
      insertLoading,
      updateLoading,
      onUpdateLoadingChange,
      onYearChange,
      selectedYear,
    },
    ref
  ) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const monthRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const [visibleYear, setVisibleYear] = useState<number | null>(null);

    const currentDate = useMemo(() => new Date(), []);
    const currentMonthIndex = useMemo(
      () => currentDate.getMonth(),
      [currentDate]
    );
    const currentYear = useMemo(() => currentDate.getFullYear(), [currentDate]);

    // Usa o ano selecionado ou o ano atual
    const displayYear = selectedYear || currentYear;

    // Gerar meses apenas para o ano selecionado (12 meses)
    const months = useMemo(() => {
      return Array.from({ length: 12 }, (_, monthIndex) => ({
        name: new Date(displayYear, monthIndex).toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric',
        }),
        year: displayYear,
        monthIndex,
        absoluteIndex: monthIndex,
      }));
    }, [displayYear]);

    // Calcular valor máximo de saída para as barras
    const maxSaida = useMemo(() => {
      let max = 0;
      registros.forEach((r) => {
        if (r.tipo === 'saida' && r.valor > max) {
          max = r.valor;
        }
      });
      return max || 1000; // Fallback para 1000
    }, [registros]);

    // Função para gerar dados de um mês
    const generateMonthData = useCallback(
      (month: any): MonthData | null => {
        const primeiroDiaMes = new Date(month.year, month.monthIndex, 1);
        const ultimoDiaMesAnterior = new Date(primeiroDiaMes);
        ultimoDiaMesAnterior.setDate(ultimoDiaMesAnterior.getDate() - 1);

        const saldoInicialMes = calculateBalanceUntilDate(
          registros,
          ultimoDiaMesAnterior,
          0
        );

        const balanceResult = calculateMonthBalance(
          registros,
          month.year,
          month.monthIndex,
          saldoInicialMes
        );

        const days = daysInMonth(month.monthIndex, month.year);
        const daysData: DayData[] = Array.from({ length: days }, (_, i) => {
          const dayNumber = i + 1;
          const date = new Date(month.year, month.monthIndex, dayNumber)
            .toISOString()
            .split('T')[0];

          const dayBalance = balanceResult.days.find(
            (d) => d.day === dayNumber
          );

          if (dayBalance) {
            return {
              day: dayNumber,
              date,
              registro: {
                entrada: dayBalance.entrada,
                saida: dayBalance.saida,
                items: dayBalance.items,
                recorrente: false,
              },
              saldo: dayBalance.saldo,
            };
          } else {
            const diasAnteriores = balanceResult.days.filter(
              (d) => d.day < dayNumber
            );
            const saldoAnterior =
              diasAnteriores.length > 0
                ? diasAnteriores[diasAnteriores.length - 1].saldo
                : saldoInicialMes;

            return {
              day: dayNumber,
              date,
              registro: undefined,
              saldo: saldoAnterior,
            };
          }
        });

        return {
          ...month,
          days,
          daysData,
        };
      },
      [registros]
    );

    const onMonthLayout = useCallback(
      (index: number, element: HTMLDivElement | null) => {
        if (element) {
          monthRefs.current.set(index, element);
        }
      },
      []
    );

    const scrollToMonth = useCallback((index: number, animated = true) => {
      const element = monthRefs.current.get(index);
      if (element && scrollRef.current) {
        element.scrollIntoView({
          behavior: animated ? 'smooth' : 'auto',
          block: 'start',
        });
      }
    }, []);

    const openModal = useCallback((date: string, data: any) => {
      console.log('Open modal:', date, data);
      // Implementar modal
    }, []);

    const handleValueChange = useCallback(
      (date: string, type: 'entrada' | 'saida', value: number) => {
        console.log('Value changed:', { date, type, value });
        // TODO: Atualizar registros com o novo valor
        // Isso deve chamar uma função para atualizar o estado/backend
      },
      []
    );

    // Gera dados de todos os meses
    const allMonthsData = useMemo(() => {
      return months.map(month => generateMonthData(month)).filter(Boolean) as MonthData[];
    }, [months, generateMonthData]);

    // Agrupa meses em conjuntos de 3
    const monthGroups = useMemo(() => {
      const groups: MonthData[][] = [];
      for (let i = 0; i < allMonthsData.length; i += 3) {
        groups.push(allMonthsData.slice(i, i + 3));
      }
      return groups;
    }, [allMonthsData]);

    // Calcula o índice do grupo que contém o mês atual
    const currentMonthGroupIndex = useMemo(() => {
      // Se o ano exibido é o ano atual, encontra o grupo do mês atual
      if (displayYear === currentYear) {
        const currentMonthAbsoluteIndex = allMonthsData.findIndex(
          (month) => month.year === currentYear && month.monthIndex === currentMonthIndex
        );
        if (currentMonthAbsoluteIndex === -1) return 0;
        return Math.floor(currentMonthAbsoluteIndex / 3);
      }
      // Se não é o ano atual, exibe o primeiro grupo
      return 0;
    }, [allMonthsData, currentYear, currentMonthIndex, displayYear]);

    const scrollToCurrentMonth = useCallback(
      (animated = true) => {
        if (scrollRef.current) {
          const groupElement = scrollRef.current.querySelector(
            `[data-group-index="${currentMonthGroupIndex}"]`
          ) as HTMLElement;
          if (groupElement) {
            // Scroll para o elemento
            groupElement.scrollIntoView({
              behavior: animated ? 'smooth' : 'auto',
              block: 'end',
            });

            // Ajusta para mostrar até o dia 29 (dias 1-29 visíveis, 30-31 ocultos)
            setTimeout(() => {
              if (scrollRef.current) {
                const rowHeight = 24;
                const daysToHide = 2; // esconder dias 30 e 31
                const scrollOffset = daysToHide * rowHeight;

                scrollRef.current.scrollTop -= scrollOffset;
              }
            }, animated ? 500 : 0);
          }
        }
      },
      [currentMonthGroupIndex]
    );

    useImperativeHandle(ref, () => ({
      scrollToCurrentMonth,
      scrollToMonth,
    }));

    // Scroll automático para o mês atual ao montar o componente
    useEffect(() => {
      if (scrollRef.current && monthGroups.length > 0) {
        // Pequeno delay para garantir que os elementos foram renderizados
        const timer = setTimeout(() => {
          const groupElement = scrollRef.current?.querySelector(
            `[data-group-index="${currentMonthGroupIndex}"]`
          ) as HTMLElement;
          if (groupElement && scrollRef.current) {
            // Scroll para o elemento
            groupElement.scrollIntoView({
              behavior: 'auto',
              block: 'end',
            });

            // Ajusta para mostrar até o dia 29 (dias 1-29 visíveis, 30-31 ocultos)
            const rowHeight = 24;
            const daysToHide = 2; // esconder dias 30 e 31
            const scrollOffset = daysToHide * rowHeight;

            scrollRef.current.scrollTop -= scrollOffset;
          }
        }, 100);

        return () => clearTimeout(timer);
      }
    }, [currentMonthGroupIndex, monthGroups.length]);

    // Notifica mudança de ano quando displayYear mudar
    useEffect(() => {
      if (displayYear && displayYear !== visibleYear) {
        setVisibleYear(displayYear);
        onYearChange?.(displayYear);
      }
    }, [displayYear, visibleYear, onYearChange]);

    return (
      <div
        ref={scrollRef}
        className="flex-1 w-full overflow-y-auto bg-white"
      >
        <div className="w-full max-w-7xl mx-auto py-8">
          {monthGroups.map((group, groupIndex) => (
            <div
              key={`group-${groupIndex}`}
              data-group-index={groupIndex}
              className="mb-12"
            >
              {/* Container horizontal com 3 meses */}
              <div className="flex border border-gray-200 bg-white overflow-hidden">
                {group.map((monthData) => (
                  <MonthColumn
                    key={`${monthData.year}-${monthData.monthIndex}`}
                    monthData={monthData}
                    onDayClick={openModal}
                    onValueChange={handleValueChange}
                    maxSaida={maxSaida}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

export default MonthlyTableList;
