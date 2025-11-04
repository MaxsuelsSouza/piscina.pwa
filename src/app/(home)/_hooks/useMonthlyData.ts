/**
 * Hook para calcular dados mensais
 */

import { useMemo } from 'react';
import type { Transaction, MonthSummary, HomeStats } from '../_types';
import {
  calculateMonthSummary,
  calculateHomeStats,
  calculateDailyBalances,
} from '../_utils/calculations';

export function useMonthlyData(transactions: Transaction[]) {
  // Calcula resumo do mês atual
  const currentMonthSummary = useMemo(() => {
    const now = new Date();
    return calculateMonthSummary(
      transactions,
      now.getFullYear(),
      now.getMonth()
    );
  }, [transactions]);

  // Calcula estatísticas para o header
  const stats = useMemo(
    () => calculateHomeStats(transactions),
    [transactions]
  );

  // Calcula todos os saldos diários
  const dailyBalances = useMemo(
    () => calculateDailyBalances(transactions),
    [transactions]
  );

  // Agrupa transações por mês
  const transactionsByMonth = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const existing = grouped.get(key) || [];
      grouped.set(key, [...existing, transaction]);
    });

    return grouped;
  }, [transactions]);

  // Calcula resumos de todos os meses
  const monthSummaries = useMemo(() => {
    const summaries: MonthSummary[] = [];
    const now = new Date();

    // Gera resumos dos últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const summary = calculateMonthSummary(
        transactions,
        date.getFullYear(),
        date.getMonth()
      );
      summaries.push(summary);
    }

    return summaries;
  }, [transactions]);

  return {
    currentMonthSummary,
    stats,
    dailyBalances,
    transactionsByMonth,
    monthSummaries,
  };
}
