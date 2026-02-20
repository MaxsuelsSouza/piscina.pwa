/**
 * Tipos para o módulo Vale a Pena Comprar
 */

export const PESSOAS_VALE_PENA = ['Maxsuel', 'Kirley'] as const;
export type PessoaValePena = (typeof PESSOAS_VALE_PENA)[number];

/** Horas trabalhadas por mês (padrão CLT: 44h/semana) */
export const HORAS_MES = 220;

/** Horas trabalhadas por dia (padrão CLT) */
export const HORAS_DIA = 8;

export interface PerfilValePena {
  id: string;
  nome: PessoaValePena;
  salarioLiquido: number;
  createdAt: string;
  updatedAt: string;
}
