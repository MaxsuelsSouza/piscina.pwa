/**
 * Cálculo do "nível" de um lutador, usado para casar os confrontos
 * e para definir a regra especial da final.
 *
 * nível = pontos da faixa + graus + (peso - 50) / 5 - compensação feminina
 *
 * Os pesos são um ponto de partida combinado com o professor e
 * devem ser ajustados com o uso real.
 */

import type { FaixaJJ } from '@/app/jiu-jitsu/_types';
import type { Sexo } from './schemas';

export const PONTOS_FAIXA: Record<FaixaJJ, number> = {
  branca: 0,
  azul: 5,
  roxa: 10,
  marrom: 15,
  preta: 20,
};

/** A cada quantos kg acima de 50 kg o nível sobe 1 ponto. */
export const KG_POR_PONTO = 5;
export const PESO_BASE_KG = 50;
/** Compensação aplicada às mulheres (equivale a ~20 kg). */
export const COMPENSACAO_FEMININA = 4;

export type DadosNivel = {
  faixa: FaixaJJ;
  graus: number;
  peso: number;
  sexo: Sexo;
};

export type ComposicaoNivel = {
  faixa: number;
  peso: number;
  sexo: number;
  total: number;
};

export function composicaoNivel({ faixa, graus, peso, sexo }: DadosNivel): ComposicaoNivel {
  const pFaixa = PONTOS_FAIXA[faixa] + graus;
  const pPeso = (peso - PESO_BASE_KG) / KG_POR_PONTO;
  const pSexo = sexo === 'F' ? -COMPENSACAO_FEMININA : 0;
  return {
    faixa: pFaixa,
    peso: arredondar(pPeso),
    sexo: pSexo,
    total: arredondar(pFaixa + pPeso + pSexo),
  };
}

export function calcularNivel(dados: DadosNivel): number {
  return composicaoNivel(dados).total;
}

function arredondar(valor: number): number {
  return Math.round(valor * 10) / 10;
}
