/**
 * MonthlyTable Types
 */

export interface Registro {
  id: string;
  date: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  descricao?: string;
  categoria?: string;
  notas?: string;
  recorrente?: boolean;
}

export interface DayData {
  day: number;
  date: string;
  registro?: {
    entrada: number;
    saida: number;
    items: Registro[];
    recorrente: boolean;
  };
  saldo: number;
}

export interface MonthData {
  name: string;
  year: number;
  monthIndex: number;
  absoluteIndex: number;
  days: number;
  daysData: DayData[];
}

export interface WeekData {
  semana: number;
  inicioSemana: number;
  fimSemana: number;
  mes: number;
  ano: number;
  diaClicado: number;
}

export interface MonthlyTableHandle {
  scrollToCurrentMonth: () => void;
  scrollToMonth: (monthIndex: number, animated?: boolean) => void;
}

export interface MonthlyTableProps {
  registros: Registro[];
  onUpdated?: () => void;
  insertLoading?: boolean;
  updateLoading?: boolean;
  onUpdateLoadingChange?: (loading: boolean) => void;
  onYearChange?: (year: number) => void;
  selectedYear?: number;
}
