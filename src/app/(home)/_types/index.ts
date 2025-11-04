/**
 * Types para a Home
 */

export interface Transaction {
  id: string;
  date: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  descricao?: string;
  categoria?: string;
  recorrente?: boolean;
}

export interface DayBalance {
  date: string;
  entrada: number;
  saida: number;
  saldo: number;
  transactions: Transaction[];
}

export interface MonthSummary {
  month: string;
  year: number;
  totalEntrada: number;
  totalSaida: number;
  saldoFinal: number;
  dias: DayBalance[];
}

export interface HomeStats {
  saldoAtual: number;
  totalEntradas: number;
  totalSaidas: number;
  transacoesHoje: number;
}
