/**
 * Ranking da temporada por faixa (função pura).
 *
 * Pontos de cada noite (absoluto + repescagem):
 *   participar 1 · vitória 2 · finalização +1 · pódio do absoluto 6/4/2
 *   · melhor da faixa na repescagem +2 · bye e W.O. não pontuam.
 *
 * Os pontos ficam na faixa que o atleta tinha naquela noite (foto do sorteio).
 * A temporada é o ano do sorteio.
 */

import { classificacao } from './chave';
import type { ChaveDoc } from './chaves';
import { melhoresPorFaixa } from './repescagem';

export const PONTOS = {
  participacao: 1,
  vitoria: 2,
  bonusFinalizacao: 1,
  podio: { campeao: 6, vice: 4, terceiro: 2 },
  melhorDaFaixaRepescagem: 2,
} as const;

export type LinhaRanking = {
  lutadorId: string;
  nome: string;
  pontos: number;
  noites: number;
  vitorias: number;
  finalizacoes: number;
  podios: number;
};

/** faixa → linhas ordenadas por pontos. */
export type Ranking = Record<string, LinhaRanking[]>;

type Entrada = { id: string; doc: ChaveDoc };

export function calcularRanking(chaves: Entrada[], ano: number): Ranking {
  const linhas = new Map<string, LinhaRanking>(); // chave: faixa|lutadorId
  const noitesContadas = new Set<string>(); // faixa|lutador|noite

  const linha = (faixa: string, id: string, nome: string) => {
    const k = `${faixa}|${id}`;
    if (!linhas.has(k)) linhas.set(k, { lutadorId: id, nome, pontos: 0, noites: 0, vitorias: 0, finalizacoes: 0, podios: 0 });
    const l = linhas.get(k)!;
    l.nome = nome; // nome mais recente
    return l;
  };

  const doAno = chaves.filter(({ doc }) => doc.chave && doc.sorteadaEm && new Date(doc.sorteadaEm).getUTCFullYear() === ano);
  // Ordem cronológica para o "nome mais recente" fazer sentido.
  doAno.sort((a, b) => a.doc.sorteadaEm!.localeCompare(b.doc.sorteadaEm!));

  for (const { id, doc } of doAno) {
    const chave = doc.chave!;
    const noite = doc.principalId ?? id; // repescagem conta como a mesma noite do absoluto
    const atleta = (aid: string) => doc.atletas.find((a) => a.id === aid);

    // Participação: quem lutou ou entrou nessa chave.
    const participantes = new Set(
      chave.lutas.filter((l) => l.status !== 'recusada').flatMap((l) => [l.azul, l.branco]).filter((x): x is string => !!x)
    );
    for (const aid of participantes) {
      const a = atleta(aid);
      if (!a) continue;
      const k = `${a.faixa}|${aid}|${noite}`;
      if (noitesContadas.has(k)) continue;
      noitesContadas.add(k);
      const l = linha(a.faixa, aid, a.nome);
      l.noites += 1;
      l.pontos += PONTOS.participacao;
    }

    // Vitórias de verdade (bye e W.O. ficam de fora).
    for (const luta of chave.lutas.filter((l) => l.status === 'finalizada' && l.metodo !== 'wo' && l.vencedor)) {
      const a = atleta(luta.vencedor!);
      if (!a) continue;
      const l = linha(a.faixa, a.id, a.nome);
      l.vitorias += 1;
      l.pontos += PONTOS.vitoria;
      if (luta.metodo === 'finalizacao') {
        l.finalizacoes += 1;
        l.pontos += PONTOS.bonusFinalizacao;
      }
    }

    if ((doc.tipo ?? 'principal') === 'principal') {
      const c = classificacao(chave);
      if (c) {
        const premiar = (aid: string, pts: number) => {
          const a = atleta(aid);
          if (!a) return;
          const l = linha(a.faixa, aid, a.nome);
          l.pontos += pts;
          l.podios += 1;
        };
        premiar(c.campeao, PONTOS.podio.campeao);
        premiar(c.vice, PONTOS.podio.vice);
        c.terceiros.forEach((t) => premiar(t, PONTOS.podio.terceiro));
      }
    } else if (classificacao(chave)) {
      for (const [faixa, aid] of Object.entries(melhoresPorFaixa(chave, doc.atletas))) {
        linha(faixa, aid, atleta(aid)!.nome).pontos += PONTOS.melhorDaFaixaRepescagem;
      }
    }
  }

  const ranking: Ranking = {};
  for (const [k, l] of linhas) {
    const faixa = k.split('|')[0];
    (ranking[faixa] ??= []).push(l);
  }
  for (const faixa of Object.keys(ranking)) {
    ranking[faixa].sort((a, b) => b.pontos - a.pontos || b.vitorias - a.vitorias || a.nome.localeCompare(b.nome, 'pt-BR'));
  }
  return ranking;
}
