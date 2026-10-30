/**
 * Repescagem (funções puras).
 *
 * Quando a 1ª rodada do absoluto termina, a repescagem é sorteada com quem
 * perdeu na estreia e com os atrasados que foram mandados para ela. Ela não
 * tem campeão único: vale o "melhor de cada faixa".
 */

import { classificacao, type Chave, type Luta } from './chave';
import type { AtletaSnapshot } from './chaves';

const reais = (l: Luta) => l.status !== 'bye' && l.status !== 'recusada' && l.status !== 'cancelada' && l.tipo !== 'desafio';

/** Todas as lutas da 1ª rodada (exceto byes) terminaram. */
export function primeiraRodadaConcluida(chave: Chave): boolean {
  if (chave.formato !== 'eliminatoria') return false;
  const primeira = chave.lutas.filter((l) => l.rodada === 1 && reais(l));
  return primeira.length > 0 && primeira.every((l) => l.status === 'finalizada');
}

/**
 * A repescagem nasce quando a 1ª rodada termina — mas só se a 1ª rodada vier
 * antes da semifinal (chave de 8+). Numa chave de 4, quem perde na estreia já
 * é bronze.
 */
export function deveGerarRepescagem(chave: Chave): boolean {
  return chave.tamanho >= 8 && primeiraRodadaConcluida(chave);
}

/** Perdedores da estreia (W.O. não entra: quem faltou não volta pela repescagem). */
export function perdedoresDaPrimeiraRodada(chave: Chave): string[] {
  return chave.lutas
    .filter((l) => l.rodada === 1 && reais(l) && l.status === 'finalizada' && l.metodo !== 'wo')
    .map((l) => (l.vencedor === l.azul ? l.branco! : l.azul!));
}

/**
 * Quem foi mais longe em cada faixa. Critério: mais vitórias; empate vai
 * para quem perdeu mais tarde; depois para o menor nível.
 */
export function melhoresPorFaixa(chave: Chave, atletas: AtletaSnapshot[]): Record<string, string> {
  const final = classificacao(chave);
  const pontos = new Map<string, { vitorias: number; ultimaRodada: number }>();
  for (const a of atletas) pontos.set(a.id, { vitorias: 0, ultimaRodada: 0 });

  for (const l of chave.lutas.filter((x) => x.status === 'finalizada' && x.metodo !== 'wo')) {
    for (const id of [l.azul, l.branco]) {
      const p = id ? pontos.get(id) : undefined;
      if (!p) continue;
      p.ultimaRodada = Math.max(p.ultimaRodada, l.rodada);
      if (l.vencedor === id) p.vitorias += 1;
    }
  }
  if (final) pontos.get(final.campeao)!.ultimaRodada += 1;

  const melhores: Record<string, string> = {};
  const porFaixa = new Map<string, AtletaSnapshot[]>();
  for (const a of atletas) porFaixa.set(a.faixa, [...(porFaixa.get(a.faixa) ?? []), a]);

  for (const [faixa, lista] of porFaixa) {
    const [melhor] = [...lista].sort((x, y) => {
      const px = pontos.get(x.id)!;
      const py = pontos.get(y.id)!;
      return py.vitorias - px.vitorias || py.ultimaRodada - px.ultimaRodada || x.nivel - y.nivel;
    });
    // Só é "melhor da faixa" quem lutou de verdade.
    if (melhor && pontos.get(melhor.id)!.ultimaRodada > 0) melhores[faixa] = melhor.id;
  }
  return melhores;
}
