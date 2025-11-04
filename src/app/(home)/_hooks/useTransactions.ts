/**
 * Hook para gerenciar transações
 */

import { useState, useEffect, useCallback } from 'react';
import type { Transaction } from '../_types';
import {
  fetchTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../_services/transactions.service';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carrega transações
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Adiciona nova transação
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id'>) => {
      try {
        const newTransaction = await createTransaction(transaction);
        setTransactions((prev) => [newTransaction, ...prev]);
        return newTransaction;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  // Atualiza transação existente
  const editTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      try {
        const updated = await updateTransaction(id, updates);
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? updated : t))
        );
        return updated;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  // Remove transação
  const removeTransaction = useCallback(async (id: string) => {
    try {
      await deleteTransaction(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, []);

  // Recarrega transações
  const refresh = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Carrega na montagem
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return {
    transactions,
    loading,
    error,
    addTransaction,
    editTransaction,
    removeTransaction,
    refresh,
  };
}
