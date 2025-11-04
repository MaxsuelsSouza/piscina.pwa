/**
 * Service para gerenciar transações
 */

import type { Transaction } from '../_types';

/**
 * Busca todas as transações
 * TODO: Conectar com API real
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  // Mock data - substituir por chamada real à API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(getMockTransactions());
    }, 500);
  });
}

/**
 * Busca transações de um período específico
 */
export async function fetchTransactionsByPeriod(
  startDate: string,
  endDate: string
): Promise<Transaction[]> {
  const allTransactions = await fetchTransactions();
  return allTransactions.filter((t) => t.date >= startDate && t.date <= endDate);
}

/**
 * Cria uma nova transação
 */
export async function createTransaction(
  transaction: Omit<Transaction, 'id'>
): Promise<Transaction> {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: `transaction-${Date.now()}`,
        ...transaction,
      });
    }, 300);
  });
}

/**
 * Atualiza uma transação existente
 */
export async function updateTransaction(
  id: string,
  updates: Partial<Transaction>
): Promise<Transaction> {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id,
        ...updates,
      } as Transaction);
    }, 300);
  });
}

/**
 * Deleta uma transação
 */
export async function deleteTransaction(id: string): Promise<void> {
  // TODO: Implementar chamada à API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });
}

/**
 * Dados mock para desenvolvimento
 */
function getMockTransactions(): Transaction[] {
  const today = new Date();
  const transactions: Transaction[] = [];

  // Gera transações dos últimos 90 dias
  for (let i = 0; i < 90; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Adiciona algumas transações aleatórias
    if (Math.random() > 0.6) {
      transactions.push({
        id: `entrada-${i}`,
        date: dateStr,
        valor: Math.floor(Math.random() * 5000) + 500,
        tipo: 'entrada',
        descricao: ['Salário', 'Freelance', 'Bonificação', 'Venda'][
          Math.floor(Math.random() * 4)
        ],
        categoria: 'trabalho',
      });
    }

    if (Math.random() > 0.5) {
      transactions.push({
        id: `saida-${i}`,
        date: dateStr,
        valor: Math.floor(Math.random() * 2000) + 100,
        tipo: 'saida',
        descricao: [
          'Aluguel',
          'Supermercado',
          'Combustível',
          'Restaurante',
          'Internet',
          'Luz',
        ][Math.floor(Math.random() * 6)],
        categoria: 'despesas',
      });
    }
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}
