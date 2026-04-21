/**
 * Tipos para o módulo de Jiu-Jitsu
 */

// Categorias de técnicas
export const CATEGORIAS_JJ = [
  'guarda',
  'passagem',
  'finalizacao',
  'raspagem',
  'queda',
  'defesa',
] as const;
export type CategoriaJJ = (typeof CATEGORIAS_JJ)[number];

export const CATEGORIAS_JJ_LABELS: Record<CategoriaJJ, string> = {
  guarda: 'Guarda',
  passagem: 'Passagem de Guarda',
  finalizacao: 'Finalização',
  raspagem: 'Raspagem',
  queda: 'Queda / Takedown',
  defesa: 'Defesa',
};

// Níveis de dificuldade
export const NIVEIS_JJ = ['iniciante', 'intermediario', 'avancado'] as const;
export type NivelJJ = (typeof NIVEIS_JJ)[number];

export const NIVEIS_JJ_LABELS: Record<NivelJJ, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

// Faixas
export const FAIXAS_JJ = [
  'branca',
  'azul',
  'roxa',
  'marrom',
  'preta',
] as const;
export type FaixaJJ = (typeof FAIXAS_JJ)[number];

export const FAIXAS_JJ_LABELS: Record<FaixaJJ, string> = {
  branca: 'Branca',
  azul: 'Azul',
  roxa: 'Roxa',
  marrom: 'Marrom',
  preta: 'Preta',
};

export const FAIXAS_JJ_COLORS: Record<FaixaJJ, string> = {
  branca: 'bg-white border-stone-300 text-stone-700',
  azul: 'bg-blue-500 text-white',
  roxa: 'bg-purple-600 text-white',
  marrom: 'bg-amber-800 text-white',
  preta: 'bg-stone-900 text-white',
};

// Interface de Técnica
export interface Tecnica {
  id: string;
  nome: string;
  categoria: CategoriaJJ;
  nivel: NivelJJ;
  notas?: string;
  videoUrl?: string;
  favorita: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface de Aula
export interface Aula {
  id: string;
  data: string; // ISO date string
  duracao: number; // minutos
  instrutor?: string;
  notas?: string;
  tecnicasPraticadas?: string[]; // IDs de técnicas
  createdAt: string;
  updatedAt: string;
}
