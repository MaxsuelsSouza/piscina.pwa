/**
 * Ajuste de desempenho (estilo Elo, na escala do "nível").
 *
 * nível do sorteio = nível físico (faixa, graus, peso, sexo) + ajuste
 *
 * Depois de cada luta o ajuste se move conforme a SURPRESA do resultado:
 * vencer quem tinha mais nível rende muito; vencer quem tinha menos rende
 * pouco. Funções puras.
 */

import type { MetodoLuta } from './schemas';

/** Quanto a diferença de nível pesa na chance de vitória (maior = mais equilíbrio). */
export const ESCALA_PROBABILIDADE = 3;
/** Movimento máximo de uma luta, para um lutador já experiente. */
export const K_BASE = 1.5;
/** O ajuste nunca passa de ±AJUSTE_MAXIMO: o desempenho corrige o físico, não o apaga. */
export const AJUSTE_MAXIMO = 6;
/** Quantas lutas até o ajuste ganhar força total. */
export const LUTAS_PARA_CONFIANCA = 4;
/** Tendência exibida ao aluno a partir deste ajuste. */
export const LIMITE_TENDENCIA = 0.5;

export type CondicaoLuta = 'normal' | 'regra_final' | 'desvantagem' | 'wo';

export type Desempenho = {
  ajuste: number;
  lutas: number;
  vitorias: number;
  atualizadoEm: string | null;
};

export const DESEMPENHO_INICIAL: Desempenho = { ajuste: 0, lutas: 0, vitorias: 0, atualizadoEm: null };

/** Chance de A vencer B, a partir dos níveis. */
export function probabilidadeVitoria(nivelA: number, nivelB: number): number {
  return 1 / (1 + Math.exp(-(nivelA - nivelB) / ESCALA_PROBABILIDADE));
}

/** Vitória rápida e por finalização diz um pouco mais sobre a diferença técnica. */
export function fatorMetodo(metodo: MetodoLuta, duracaoSeg: number | null, duracaoTotalSeg: number | null): number {
  if (metodo !== 'finalizacao') return 1;
  const rapida = duracaoSeg !== null && duracaoTotalSeg && duracaoSeg <= duracaoTotalSeg / 3;
  return rapida ? 1.25 : 1.1;
}

/** Lutas em condição desigual dizem menos; W.O. não diz nada. */
export function fatorCondicao(condicao: CondicaoLuta): number {
  return condicao === 'wo' ? 0 : condicao === 'normal' ? 1 : 0.5;
}

/** Peso das primeiras lutas: começa em 1/3 e chega a 1 com a experiência. */
export function confianca(lutas: number): number {
  return Math.min(1, (lutas + 2) / (LUTAS_PARA_CONFIANCA + 2));
}

export type EntradaAjuste = {
  vencedor: { nivel: number; desempenho: Desempenho };
  perdedor: { nivel: number; desempenho: Desempenho };
  metodo: MetodoLuta;
  duracaoSeg: number | null;
  duracaoTotalSeg: number | null;
  condicao: CondicaoLuta;
};

export type ResultadoAjuste = {
  deltaVencedor: number;
  deltaPerdedor: number;
  chanceVencedor: number;
};

/**
 * Calcula quanto o ajuste de cada um muda. `nivel` deve ser o nível do
 * sorteio (físico + ajuste) no momento da luta.
 */
export function calcularAjuste(e: EntradaAjuste): ResultadoAjuste {
  const chance = probabilidadeVitoria(e.vencedor.nivel, e.perdedor.nivel);
  const surpresa = 1 - chance;
  const peso = fatorMetodo(e.metodo, e.duracaoSeg, e.duracaoTotalSeg) * fatorCondicao(e.condicao);
  return {
    deltaVencedor: arredondar(K_BASE * confianca(e.vencedor.desempenho.lutas) * surpresa * peso),
    deltaPerdedor: -arredondar(K_BASE * confianca(e.perdedor.desempenho.lutas) * surpresa * peso),
    chanceVencedor: arredondar(chance, 3),
  };
}

/** Aplica um delta respeitando o teto. `venceu` null = não conta como luta (W.O.). */
export function aplicarDelta(d: Desempenho, delta: number, venceu: boolean | null, agora: string): Desempenho {
  if (venceu === null) return d;
  return {
    ajuste: limitar(arredondar(d.ajuste + delta)),
    lutas: d.lutas + 1,
    vitorias: d.vitorias + (venceu ? 1 : 0),
    atualizadoEm: agora,
  };
}

/** Desfaz um delta aplicado antes (usado ao desfazer um resultado). */
export function reverterDelta(d: Desempenho, delta: number, venceu: boolean | null, agora: string): Desempenho {
  if (venceu === null) return d;
  return {
    ajuste: limitar(arredondar(d.ajuste - delta)),
    lutas: Math.max(0, d.lutas - 1),
    vitorias: Math.max(0, d.vitorias - (venceu ? 1 : 0)),
    atualizadoEm: agora,
  };
}

export type Tendencia = 'alta' | 'estavel' | 'baixa';

export function tendencia(ajuste: number): Tendencia {
  if (ajuste >= LIMITE_TENDENCIA) return 'alta';
  if (ajuste <= -LIMITE_TENDENCIA) return 'baixa';
  return 'estavel';
}

function limitar(v: number) {
  return Math.max(-AJUSTE_MAXIMO, Math.min(AJUSTE_MAXIMO, v));
}

function arredondar(v: number, casas = 2) {
  const f = 10 ** casas;
  return Math.round(v * f) / f;
}
