import { describe, expect, it } from 'vitest';
import { filaDeLutas, gerarChave, iniciarLuta, registrarResultado, TOLERANCIA_SORTEIO, type Chave } from '../chave';
import {
  ChaveCriarSchema,
  detalheChave,
  novaChaveDoc,
  podeAlterarInscricoes,
  resumoChave,
  snapshotAtleta,
  statusDaChave,
  type AtletaSnapshot,
  type ChaveDoc,
} from '../chaves';
import { novoLutadorDoc } from '../lutadores';

function atletas(n: number): AtletaSnapshot[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `a${i + 1}`, nome: `Atleta ${i + 1}`, nivel: (i + 1) * 2, sexo: 'M', faixa: 'branca', graus: 0, peso: 70,
  }));
}

function docSorteado(n: number): ChaveDoc {
  const lista = atletas(n);
  return {
    ...novaChaveDoc('Sexta', lista.map((a) => a.id), 'uid-1', '2026-10-30T10:00:00.000Z'),
    atletas: lista,
    chave: gerarChave(lista),
    sorteadaEm: '2026-10-30T10:05:00.000Z',
  };
}

function jogarTudo(chave: Chave): Chave {
  let atual = chave;
  for (let i = 0; i < 100; i++) {
    const proxima = filaDeLutas(atual)[0];
    if (!proxima) return atual;
    atual = registrarResultado(atual, proxima.id, proxima.azul!, 'decisao');
  }
  return atual;
}

/** Gerador pseudoaleatório reproduzível para os testes. */
function semente(s: number) {
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

describe('sorteio com sorte', () => {
  it('sem gerador a chave é sempre igual', () => {
    expect(gerarChave(atletas(8))).toEqual(gerarChave(atletas(8)));
  });

  it('com gerador, sorteios diferentes podem mudar os confrontos', () => {
    // Níveis próximos (0,5 de distância) trocam de lugar com o ruído.
    const proximos = atletas(8).map((a, i) => ({ ...a, nivel: i * 0.5 }));
    const formatos = new Set(
      [1, 2, 3, 4, 5, 6].map((s) => JSON.stringify(gerarChave(proximos, { aleatorio: semente(s) }).lutas.map((l) => [l.azul, l.branco])))
    );
    expect(formatos.size).toBeGreaterThan(1);
  });

  it('ninguém enfrenta alguém muito distante do próprio nível na 1ª rodada', () => {
    const lista = atletas(16); // níveis 2, 4, ..., 32
    for (let s = 1; s <= 50; s++) {
      const chave = gerarChave(lista, { aleatorio: semente(s) });
      for (const l of chave.lutas.filter((x) => x.rodada === 1 && x.azul && x.branco)) {
        const nivel = (id: string) => lista.find((a) => a.id === id)!.nivel;
        expect(Math.abs(nivel(l.azul!) - nivel(l.branco!))).toBeLessThanOrEqual(2 + TOLERANCIA_SORTEIO * 2);
      }
    }
  });

  it('a lista de atletas da chave continua em ordem real de nível', () => {
    const chave = gerarChave(atletas(8), { aleatorio: semente(7) });
    const niveis = chave.atletas.map((a) => a.nivel);
    expect(niveis).toEqual([...niveis].sort((a, b) => a - b));
  });
});

describe('status da chave', () => {
  it('rascunho → sorteada → em andamento → encerrada', () => {
    const rascunho = novaChaveDoc('Sexta', [], 'uid-1', 'agora');
    expect(statusDaChave(rascunho)).toBe('rascunho');

    const sorteada = docSorteado(4);
    expect(statusDaChave(sorteada)).toBe('sorteada');
    expect(podeAlterarInscricoes(sorteada)).toBe(true);

    const comecou = { ...sorteada, chave: iniciarLuta(sorteada.chave!, 'A-1-1') };
    expect(statusDaChave(comecou)).toBe('em_andamento');
    expect(podeAlterarInscricoes(comecou)).toBe(false);

    const fim = { ...sorteada, chave: jogarTudo(sorteada.chave!) };
    expect(statusDaChave(fim)).toBe('encerrada');
  });
});

describe('resumo para a tela 1', () => {
  it('chave recém-sorteada', () => {
    const r = resumoChave('c1', docSorteado(8));
    expect(r).toMatchObject({ status: 'sorteada', totalAtletas: 8, restantes: 8, rodadaAtual: 'Quartas', progresso: 0, campeao: null });
  });

  it('depois das quartas', () => {
    const doc = docSorteado(8);
    let chave = doc.chave!;
    for (const id of ['A-1-1', 'A-1-2', 'B-1-1', 'B-1-2']) {
      const l = chave.lutas.find((x) => x.id === id)!;
      chave = registrarResultado(chave, id, l.azul!, 'decisao');
    }
    const r = resumoChave('c1', { ...doc, chave });
    expect(r).toMatchObject({ status: 'em_andamento', restantes: 4, rodadaAtual: 'Semifinal' });
    expect(r.progresso).toBeCloseTo(4 / 7, 2);
  });

  it('encerrada mostra o campeão pelo nome', () => {
    const doc = docSorteado(4);
    const r = resumoChave('c1', { ...doc, chave: jogarTudo(doc.chave!) });
    expect(r.status).toBe('encerrada');
    expect(r.campeao).toMatch(/^Atleta /);
    expect(r.restantes).toBe(1);
    expect(r.progresso).toBe(1);
  });

  it('com byes, restantes desconta só quem perdeu', () => {
    const doc = docSorteado(5); // 3 byes
    expect(resumoChave('c1', doc).restantes).toBe(5);
  });
});

describe('detalhe para as telas 3 a 5', () => {
  it('traz rodadas nomeadas, fila e regra da final quando há finalistas', () => {
    const doc = docSorteado(4);
    let chave = doc.chave!;
    expect(detalheChave('c1', doc).rodadas.map((r) => r.nome)).toEqual(['Semifinal', 'Final']);
    expect(detalheChave('c1', doc).fila).toEqual(['A-1-1', 'B-1-1']);
    expect(detalheChave('c1', doc).regraFinal).toBeNull();

    chave = registrarResultado(chave, 'A-1-1', 'a1', 'decisao');
    chave = registrarResultado(chave, 'B-1-1', 'a4', 'decisao');
    const det = detalheChave('c1', { ...doc, chave });
    // a1 nível 2, a4 nível 8 → diferença 6 → dentro da guarda
    expect(det.regraFinal).toEqual({ texto: 'Atleta 4 começa dentro da guarda de Atleta 1', diferenca: 6, posicao: 'dentro-da-guarda' });
    expect(det.fila).toEqual(['final']);
  });
});

describe('snapshot do atleta', () => {
  it('congela nome, nível e dados físicos', () => {
    const lutador = novoLutadorDoc({ nome: 'Júlia', sexo: 'F', peso: 64, faixa: 'branca', graus: 3 }, 'uid-1', 'agora');
    expect(snapshotAtleta('l1', lutador)).toEqual({
      id: 'l1', nome: 'Júlia', nivel: 1.8, nivelFisico: 1.8, ajuste: 0, sexo: 'F', faixa: 'branca', graus: 3, peso: 64,
    });
  });

  it('usa o nível do sorteio (físico + ajuste) e marca atrasados', () => {
    const base = novoLutadorDoc({ nome: 'Júlia', sexo: 'F', peso: 64, faixa: 'branca', graus: 3 }, 'uid-1', 'agora');
    const lutador = { ...base, desempenho: { ajuste: 1.5, lutas: 4, vitorias: 3, atualizadoEm: 'x' } };
    expect(snapshotAtleta('l1', lutador, true)).toMatchObject({ nivel: 3.3, nivelFisico: 1.8, ajuste: 1.5, atrasado: true });
  });
});

describe('validação ao criar chave', () => {
  it('inscritos é opcional', () => expect(ChaveCriarSchema.parse({ nome: 'Sexta' }).inscritos).toEqual([]));
  it('recusa inscritos repetidos', () => expect(ChaveCriarSchema.safeParse({ nome: 'Sexta', inscritos: ['a', 'a'] }).success).toBe(false));
  it('recusa mais de 30', () =>
    expect(ChaveCriarSchema.safeParse({ nome: 'Sexta', inscritos: Array.from({ length: 31 }, (_, i) => `l${i}`) }).success).toBe(false));
});
