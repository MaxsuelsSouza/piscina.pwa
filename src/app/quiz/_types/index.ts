/**
 * Tipos para o modulo de Quiz
 */

// Niveis de dificuldade
export const NIVEIS_QUIZ = ['Facil', 'Medio', 'Dificil'] as const;
export type NivelQuiz = (typeof NIVEIS_QUIZ)[number];

export const NIVEL_QUIZ_LABELS: Record<NivelQuiz, string> = {
  Facil: 'Facil',
  Medio: 'Medio',
  Dificil: 'Dificil',
};

export const NIVEL_QUIZ_COLORS: Record<NivelQuiz, { bg: string; text: string }> = {
  Facil: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  Medio: { bg: 'bg-amber-100', text: 'text-amber-700' },
  Dificil: { bg: 'bg-red-100', text: 'text-red-700' },
};

// Status do quiz
export const STATUS_QUIZ = ['ativo', 'inativo'] as const;
export type StatusQuiz = (typeof STATUS_QUIZ)[number];

// Questao individual
export interface Questao {
  id: string;
  numero: number;
  nivel: NivelQuiz;
  pergunta: string;
  resposta: string;
  link: string;
}

// Quiz completo (colecao de questoes)
export interface Quiz {
  id: string;
  nome: string;
  descricao?: string;
  status: StatusQuiz;
  questoes: Questao[];
  totalQuestoes: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizDocument extends Omit<Quiz, 'id'> {}
