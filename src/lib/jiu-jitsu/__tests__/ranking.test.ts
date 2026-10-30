import { describe, expect, it } from 'vitest';
import { buscarLuta, filaDeLutas, gerarChave, registrarResultado, registrarWO, type Chave } from '../chave';
import { novaChaveDoc, type AtletaSnapshot, type ChaveDoc } from '../chaves';
import { calcularRanking } from '../ranking';
import { deveGerarRepescagem, melhoresPorFaixa, perdedoresDaPrimeiraRodada, primeiraRodadaConcluida } from '../repescagem';

function snapshots(defs: [string, string, number][]): AtletaSnapshot[] {
  return defs.map(([id, faixa, nivel]) => ({
    id, nome: id.toUpperCase(), nivel, faixa: faixa as AtletaSnapshot['faixa'], sexo: 'M', graus: 0, peso: 70,
  }));
}

/** Vence sempre o de MAIOR nível; método escolhido por id. */
function jogar(chave: Chave, atletas: AtletaSnapshot[], finalizacoes: string[] = []): Chave {
  const nivel = (id: string) => atletas.find((a) => a.id === id)!.nivel;
  let c = chave;
  for (let i = 0; i < 50 && filaDeLutas(c).length; i++) {
    const l = filaDeLutas(c)[0];
    const v = nivel(l.azul!) > nivel(l.branco!) ? l.azul! : l.branco!;
    c = registrarResultado(c, l.id, v, finalizacoes.includes(v) ? 'finalizacao' : 'decisao');
  }
  return c;
}

function doc(atletas: AtletaSnapshot[], chave: Chave, extra: Partial<ChaveDoc> = {}): ChaveDoc {
  return {
    ...novaChaveDoc('Sexta', atletas.map((a) => a.id), 'uid', '2026-10-30T20:00:00Z'),
    atletas, chave, sorteadaEm: '2026-10-30T20:00:00Z', ...extra,
  };
}

describe('repescagem', () => {
  const lista = snapshots([['b1', 'branca', 1], ['b2', 'branca', 2], ['a1', 'azul', 6], ['a2', 'azul', 7], ['r1', 'roxa', 11], ['r2', 'roxa', 12], ['b3', 'branca', 3], ['a3', 'azul', 8]]);

  it('nasce quando a 1ª rodada acaba, só em chave de 8+', () => {
    let chave = gerarChave(lista);
    expect(primeiraRodadaConcluida(chave)).toBe(false);
    for (const id of ['A-1-1', 'A-1-2', 'B-1-1', 'B-1-2']) {
      const l = buscarLuta(chave, id);
      chave = registrarResultado(chave, id, l.azul!, 'decisao');
    }
    expect(deveGerarRepescagem(chave)).toBe(true);
    expect(perdedoresDaPrimeiraRodada(chave)).toHaveLength(4);
    expect(deveGerarRepescagem(jogar(gerarChave(lista.slice(0, 4)), lista))).toBe(false);
  });

  it('W.O. não manda o ausente para a repescagem', () => {
    let chave = gerarChave(lista);
    chave = registrarWO(chave, 'A-1-1', buscarLuta(chave, 'A-1-1').azul!);
    expect(perdedoresDaPrimeiraRodada(chave)).toEqual([]);
  });

  it('melhor de cada faixa é quem foi mais longe', () => {
    const fim = jogar(gerarChave(lista), lista);
    // Lado A: (b1×b2) e (b3×a1) → b2 e a1 → semi a1. Lado B: (a2×a3) e (r1×r2) → a3 e r2 → semi r2.
    // Branca: b2 (1 vitória). Azul: a1 (2 vitórias, chegou à final). Roxa: r2 (campeão).
    expect(melhoresPorFaixa(fim, lista)).toEqual({ branca: 'b2', azul: 'a1', roxa: 'r2' });
  });
});

describe('ranking da temporada', () => {
  const lista = snapshots([['b1', 'branca', 1], ['b2', 'branca', 2], ['a1', 'azul', 6], ['a2', 'azul', 7]]);

  it('soma participação, vitórias, finalizações e pódio, separado por faixa', () => {
    const fim = jogar(gerarChave(lista), lista, ['a2']);
    // Semis: b2 vence b1 (lado A), a2 vence a1 (lado B, finalização); final: a2 vence b2 (finalização).
    const r = calcularRanking([{ id: 'c1', doc: doc(lista, fim) }], 2026);
    const linha = (faixa: string, id: string) => r[faixa].find((l) => l.lutadorId === id)!;

    // a2: 1 participação + 2 vitórias (2+2) + 2 finalizações (+1+1) + campeão (+6) = 13
    expect(linha('azul', 'a2')).toMatchObject({ pontos: 13, vitorias: 2, finalizacoes: 2, podios: 1, noites: 1 });
    // b2: 1 + 1 vitória (2) + vice (4) = 7
    expect(linha('branca', 'b2')).toMatchObject({ pontos: 7, podios: 1 });
    // a1 e b1: 1 + terceiro (2) = 3
    expect(linha('azul', 'a1').pontos).toBe(3);
    expect(linha('branca', 'b1').pontos).toBe(3);
    expect(r.azul.map((l) => l.lutadorId)).toEqual(['a2', 'a1']);
  });

  it('soma noites diferentes e ignora outros anos', () => {
    const noite1 = doc(lista, jogar(gerarChave(lista), lista));
    const noite2 = { ...doc(lista, jogar(gerarChave(lista), lista)), sorteadaEm: '2026-11-06T20:00:00Z' };
    const anoPassado = { ...doc(lista, jogar(gerarChave(lista), lista)), sorteadaEm: '2025-11-06T20:00:00Z' };
    const r = calcularRanking([{ id: 'n1', doc: noite1 }, { id: 'n2', doc: noite2 }, { id: 'n0', doc: anoPassado }], 2026);
    expect(r.azul.find((l) => l.lutadorId === 'a2')!.noites).toBe(2);
  });

  it('pontos ficam na faixa daquela noite (graduação no meio da temporada)', () => {
    const graduado = lista.map((a) => (a.id === 'b2' ? { ...a, faixa: 'azul' as const } : a));
    const r = calcularRanking([
      { id: 'n1', doc: doc(lista, jogar(gerarChave(lista), lista)) },
      { id: 'n2', doc: { ...doc(graduado, jogar(gerarChave(graduado), graduado)), sorteadaEm: '2026-11-06T20:00:00Z' } },
    ], 2026);
    expect(r.branca.some((l) => l.lutadorId === 'b2')).toBe(true);
    expect(r.azul.some((l) => l.lutadorId === 'b2')).toBe(true);
  });

  it('repescagem conta como a mesma noite e dá +2 ao melhor da faixa', () => {
    const principal = doc(lista, jogar(gerarChave(lista), lista));
    const rep = { ...doc(lista.slice(0, 2), jogar(gerarChave(lista.slice(0, 2)), lista)), tipo: 'repescagem' as const, principalId: 'n1' };
    const r = calcularRanking([{ id: 'n1', doc: principal }, { id: 'r1', doc: rep }], 2026);
    const b2 = r.branca.find((l) => l.lutadorId === 'b2')!;
    expect(b2.noites).toBe(1); // não conta duas participações
    // principal: 1 + 2 + vice 4 = 7; repescagem (melhor de 3, b2 vence 2x): 2+2 + melhor da faixa 2 = 6
    expect(b2.pontos).toBe(13);
  });

  it('W.O. e bye não pontuam como vitória', () => {
    let chave = gerarChave(lista);
    chave = registrarWO(chave, 'A-1-1', buscarLuta(chave, 'A-1-1').azul!);
    const r = calcularRanking([{ id: 'c', doc: doc(lista, chave) }], 2026);
    const presente = buscarLuta(chave, 'A-1-1').vencedor!;
    expect(r.branca.find((l) => l.lutadorId === presente)!.vitorias).toBe(0);
  });
});
