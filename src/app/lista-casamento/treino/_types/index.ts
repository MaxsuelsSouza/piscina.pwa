/**
 * Tipos para o módulo de Treino
 */

// Pessoas cadastradas para treino
export const PESSOAS_TREINO = ['Maxsuel', 'Kirley'] as const;
export type PessoaTreino = (typeof PESSOAS_TREINO)[number];

// Status do treino
export const STATUS_TREINO = ['em_construcao', 'em_progresso', 'inativo'] as const;
export type StatusTreino = (typeof STATUS_TREINO)[number];

export const STATUS_TREINO_LABELS: Record<StatusTreino, string> = {
  em_construcao: 'Em construção',
  em_progresso: 'Em progresso',
  inativo: 'Inativo',
};

export interface Exercicio {
  id: string;
  nome: string;
  series: number;
  repeticoes: string; // Pode ser "10" ou "10-12" ou "até a falha"
  videoUrl?: string;
  ordem: number;
}

// Status do dia de treino
export const STATUS_DIA = ['ativo', 'inativo'] as const;
export type StatusDia = (typeof STATUS_DIA)[number];

export interface DiaTreino {
  id: string;
  numero: number; // 1, 2, 3...
  nome?: string; // Nome opcional do dia (ex: "Peito e Tríceps")
  status: StatusDia;
  exercicios: Exercicio[];
}

export interface Treino {
  id: string;
  nome: string;
  descricao?: string;
  pessoa: PessoaTreino;
  status: StatusTreino;
  quantidadeDias: number; // Quantidade de dias do treino
  dias: DiaTreino[]; // Array de dias com exercícios
  exercicios: Exercicio[]; // Mantido para compatibilidade
  createdAt: string;
  updatedAt: string;
}

export interface TreinoDocument extends Omit<Treino, 'id'> {}
