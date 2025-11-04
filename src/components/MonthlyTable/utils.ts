/**
 * MonthlyTable Utilities
 */

import { Registro, DayData } from './types';

export const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function formatarBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function generateMonthsFromCreation(
  referenceDate: Date,
  maxMonths: number = 12
) {
  const months = [];
  const currentYear = referenceDate.getFullYear();

  // Gera 4 anos completos: ano anterior, ano atual, e 2 anos posteriores
  const startYear = currentYear - 1;
  const totalYears = 4;

  for (let yearOffset = 0; yearOffset < totalYears; yearOffset++) {
    const year = startYear + yearOffset;

    // Gera todos os 12 meses do ano
    for (let month = 0; month < 12; month++) {
      const monthData = {
        name: `${monthNames[month]} ${year}`,
        year: year,
        monthIndex: month,
        absoluteIndex: yearOffset * 12 + month,
      };
      months.push(monthData);
    }
  }

  return months;
}

export function calculateBalanceUntilDate(
  registros: Registro[],
  date: Date,
  initialBalance: number = 0
): number {
  let saldo = initialBalance;

  registros.forEach((registro) => {
    const registroDate = new Date(registro.date);
    if (registroDate <= date) {
      if (registro.tipo === 'entrada') {
        saldo += registro.valor;
      } else {
        saldo -= registro.valor;
      }
    }
  });

  return saldo;
}

export function calculateMonthBalance(
  registros: Registro[],
  year: number,
  month: number,
  initialBalance: number = 0
) {
  const days: Array<{
    day: number;
    entrada: number;
    saida: number;
    saldo: number;
    items: Registro[];
  }> = [];

  const daysCount = daysInMonth(month, year);
  let currentSaldo = initialBalance;

  for (let day = 1; day <= daysCount; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const dayRegistros = registros.filter((r) => r.date === dateStr);

    const entrada = dayRegistros
      .filter((r) => r.tipo === 'entrada')
      .reduce((sum, r) => sum + r.valor, 0);

    const saida = dayRegistros
      .filter((r) => r.tipo === 'saida')
      .reduce((sum, r) => sum + r.valor, 0);

    currentSaldo += entrada - saida;

    if (dayRegistros.length > 0) {
      days.push({
        day,
        entrada,
        saida,
        saldo: currentSaldo,
        items: dayRegistros,
      });
    }
  }

  return { days, finalBalance: currentSaldo };
}

export function getSaldoColor(value: number): string {
  if (value > 2000) return 'text-green-600';
  if (value >= 1000) return 'text-green-400';
  if (value >= 0) return 'text-yellow-400';
  if (value <= -500) return 'text-red-600';
  return 'text-red-400';
}
