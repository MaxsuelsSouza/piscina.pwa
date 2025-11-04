/**
 * Utilitários de cálculo para a Home
 */

import type { Transaction, DayBalance, MonthSummary } from '../_types';

/**
 * Calcula o saldo de um conjunto de transações
 */
export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, transaction) => {
    if (transaction.tipo === 'entrada') {
      return acc + transaction.valor;
    } else {
      return acc - transaction.valor;
    }
  }, 0);
}

/**
 * Agrupa transações por data
 */
export function groupTransactionsByDate(
  transactions: Transaction[]
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const existing = grouped.get(transaction.date) || [];
    grouped.set(transaction.date, [...existing, transaction]);
  });

  return grouped;
}

/**
 * Calcula o saldo diário com acumulado
 */
export function calculateDailyBalances(
  transactions: Transaction[],
  initialBalance: number = 0
): DayBalance[] {
  const grouped = groupTransactionsByDate(transactions);
  const dates = Array.from(grouped.keys()).sort();

  let currentBalance = initialBalance;
  const balances: DayBalance[] = [];

  dates.forEach((date) => {
    const dayTransactions = grouped.get(date) || [];
    const entrada = dayTransactions
      .filter((t) => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0);
    const saida = dayTransactions
      .filter((t) => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0);

    currentBalance = currentBalance + entrada - saida;

    balances.push({
      date,
      entrada,
      saida,
      saldo: currentBalance,
      transactions: dayTransactions,
    });
  });

  return balances;
}

/**
 * Calcula resumo mensal
 */
export function calculateMonthSummary(
  transactions: Transaction[],
  year: number,
  month: number,
  initialBalance: number = 0
): MonthSummary {
  const monthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  const dailyBalances = calculateDailyBalances(monthTransactions, initialBalance);

  const totalEntrada = monthTransactions
    .filter((t) => t.tipo === 'entrada')
    .reduce((sum, t) => sum + t.valor, 0);

  const totalSaida = monthTransactions
    .filter((t) => t.tipo === 'saida')
    .reduce((sum, t) => sum + t.valor, 0);

  const saldoFinal = initialBalance + totalEntrada - totalSaida;

  return {
    month: new Date(year, month).toLocaleDateString('pt-BR', { month: 'long' }),
    year,
    totalEntrada,
    totalSaida,
    saldoFinal,
    dias: dailyBalances,
  };
}

/**
 * Calcula estatísticas para o header
 */
export function calculateHomeStats(transactions: Transaction[]): {
  saldoAtual: number;
  totalEntradas: number;
  totalSaidas: number;
  transacoesHoje: number;
} {
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter((t) => t.date === today);

  return {
    saldoAtual: calculateBalance(transactions),
    totalEntradas: transactions
      .filter((t) => t.tipo === 'entrada')
      .reduce((sum, t) => sum + t.valor, 0),
    totalSaidas: transactions
      .filter((t) => t.tipo === 'saida')
      .reduce((sum, t) => sum + t.valor, 0),
    transacoesHoje: todayTransactions.length,
  };
}
