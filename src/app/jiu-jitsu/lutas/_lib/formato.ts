/**
 * Formatação e cores compartilhadas pelas telas de lutas.
 */

import type { FaixaJJ } from '../../_types';
import { FAIXAS_JJ_LABELS } from '../../_types';

export const COR_FAIXA: Record<FaixaJJ, string> = {
  branca: '#f5f5f4',
  azul: '#2563eb',
  roxa: '#7c3aed',
  marrom: '#78350f',
  preta: '#0c0a09',
};

export function nivelTxt(n: number): string {
  return (n < 0 ? '−' : '') + Math.abs(n).toFixed(1).replace('.', ',');
}

export function pesoTxt(p: number): string {
  return `${String(p).replace('.', ',')} kg`;
}

export function faixaTxt(faixa: FaixaJJ, graus: number): string {
  return FAIXAS_JJ_LABELS[faixa] + (graus ? ` ${graus}º` : '');
}

export function infoAtleta(a: { sexo: 'M' | 'F'; faixa: FaixaJJ; graus: number; peso: number }): string {
  return `${a.sexo === 'F' ? 'Fem' : 'Masc'} · ${faixaTxt(a.faixa, a.graus)} · ${pesoTxt(a.peso)}`;
}

export function tempoTxt(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function dataCurta(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export const METODO_LABEL = { finalizacao: 'Finalização', decisao: 'Decisão', wo: 'W.O.' } as const;
