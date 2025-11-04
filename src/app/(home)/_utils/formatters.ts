/**
 * Utilitários de formatação para a Home
 */

/**
 * Formata valor em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata data em português
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Formata data longa (Ex: 15 de outubro de 2025)
 */
export function formatLongDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Retorna cor baseada no valor (positivo/negativo)
 */
export function getValueColor(value: number): string {
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-400';
}

/**
 * Retorna classe CSS para background baseado no tipo de transação
 */
export function getTransactionBg(tipo: 'entrada' | 'saida'): string {
  return tipo === 'entrada'
    ? 'bg-green-500/10 border-green-500/50'
    : 'bg-red-500/10 border-red-500/50';
}
