/**
 * Tipos para o modulo de Cronograma Capilar
 */

export const TIPOS_TRATAMENTO = ['hidratacao', 'nutricao', 'reconstrucao'] as const;
export type TipoTratamento = (typeof TIPOS_TRATAMENTO)[number];

export const TRATAMENTO_LABELS: Record<TipoTratamento, string> = {
  hidratacao: 'Hidratacao',
  nutricao: 'Nutricao',
  reconstrucao: 'Reconstrucao',
};

export const TRATAMENTO_COLORS: Record<TipoTratamento, { bg: string; text: string; accent: string }> = {
  hidratacao: { bg: 'bg-blue-100', text: 'text-blue-700', accent: 'bg-blue-500' },
  nutricao: { bg: 'bg-amber-100', text: 'text-amber-700', accent: 'bg-amber-500' },
  reconstrucao: { bg: 'bg-rose-100', text: 'text-rose-700', accent: 'bg-rose-500' },
};

export const TRATAMENTO_PAUSA: Record<TipoTratamento, string> = {
  hidratacao: '20-30 min',
  nutricao: '15-20 min',
  reconstrucao: '5-10 min',
};

export const TRATAMENTO_DICAS: Record<TipoTratamento, string> = {
  hidratacao: 'Reponha a agua dos fios. Use mascaras com aloe vera, pantenol ou glicerina.',
  nutricao: 'Devolva oleos essenciais aos fios. Use mascaras com oleo de coco, argan ou manteiga de karite.',
  reconstrucao: 'Reponha a massa capilar. Use mascaras com queratina, cisteina ou aminoacidos.',
};

// Intervalo minimo entre tratamentos (em horas)
export const INTERVALO_MINIMO_HORAS = 48;

// Intervalo para reconstrucao (em dias)
export const INTERVALO_RECONSTRUCAO_DIAS = 15;

// Intervalo para nutricao (em dias)
export const INTERVALO_NUTRICAO_DIAS = 7;

export interface TratamentoRealizado {
  id: string;
  tipo: TipoTratamento;
  data: string; // ISO timestamp
}

export interface CronogramaCapilar {
  id: string;
  nome: string;
  tratamentosAtivos: TipoTratamento[];
  historico: TratamentoRealizado[];
  status: 'ativo' | 'inativo';
  createdAt: string;
  updatedAt: string;
}
