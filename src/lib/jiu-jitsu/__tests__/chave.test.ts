import { describe, expect, it } from 'vitest';
import {
  classificacao,
  desfazerResultado,
  ErroChave,
  filaDeLutas,
  gerarChave,
  iniciarLuta,
  nomeRodada,
  posicaoPorDiferenca,
  proximaPotenciaDe2,
  registrarResultado,
  regraEspecialFinal,
  type AtletaChave,
  type Chave,
} from '../chave';

/** Atletas com níveis distintos e conhecidos: a1 = 1, a2 = 2, ... */
function atletas(n: number): AtletaChave[] {
  return Array.from({ length: n }, (_, i) => ({ id: `a${i + 1}`, nome: `Atleta ${i + 1}`, nivel: i + 1 }));
}

/** Joga a chave inteira escolhendo o vencedor com `escolher`. */
function jogarTudo(chave: Chave, escolher: (azul: string, branco: string) => string): Chave {
  let atual = chave;
  for (let guarda = 0; guarda < 200; guarda++) {
    const proxima = filaDeLutas(atual)[0];
    if (!proxima) return atual;
    const vencedor = escolher(proxima.azul!, proxima.branco!);
    atual = registrarResultado(atual, proxima.id, vencedor, 'decisao');
  }
  throw new Error('A chave não terminou');
}

const maiorNivelVence = (a: string, b: string) => (Number(a.slice(1)) > Number(b.slice(1)) ? a : b);
const menorNivelVence = (a: string, b: string) => (Number(a.slice(1)) < Number(b.slice(1)) ? a : b);

describe('proximaPotenciaDe2', () => {
  it.each([
    [4, 4],
    [5, 8],
    [8, 8],
    [9, 16],
    [17, 32],
    [30, 32],
  ])('%i → %i', (n, esperado) => expect(proximaPotenciaDe2(n)).toBe(esperado));
});

describe('validação', () => {
  it('recusa menos de 2 atletas', () => {
    expect(() => gerarChave(atletas(1))).toThrow(ErroChave);
  });
  it('recusa mais de 30 atletas', () => {
    expect(() => gerarChave(atletas(31))).toThrow(ErroChave);
  });
  it('recusa atletas repetidos', () => {
    const lista = atletas(4);
    lista[3] = { ...lista[3], id: 'a1' };
    expect(() => gerarChave(lista)).toThrow(/repetidos/);
  });
});

describe('formato por quantidade de atletas', () => {
  it('2 atletas: melhor de três', () => expect(gerarChave(atletas(2)).formato).toBe('melhor-de-3'));
  it('3 atletas: chave de três', () => expect(gerarChave(atletas(3)).formato).toBe('chave-de-3'));
  it('4+ atletas: eliminatória', () => expect(gerarChave(atletas(4)).formato).toBe('eliminatoria'));
});

describe('eliminatória de 4 a 30 atletas', () => {
  for (let n = 4; n <= 30; n++) {
    describe(`${n} atletas`, () => {
      const chave = gerarChave(atletas(n));
      const primeira = chave.lutas.filter((l) => l.rodada === 1);
      const idsPrimeira = primeira.flatMap((l) => [l.azul, l.branco]).filter(Boolean);

      it('todo atleta aparece exatamente uma vez na 1ª rodada', () => {
        expect([...idsPrimeira].sort()).toEqual(atletas(n).map((a) => a.id).sort());
      });

      it('tem n - 1 lutas de verdade e o número certo de byes', () => {
        const byes = chave.lutas.filter((l) => l.status === 'bye').length;
        expect(byes).toBe(chave.tamanho - n);
        expect(chave.lutas.filter((l) => l.status !== 'bye').length).toBe(n - 1);
      });

      it('lado A só tem níveis menores ou iguais aos do lado B', () => {
        const nivel = (id: string) => chave.atletas.find((a) => a.id === id)!.nivel;
        const doLado = (lado: 'A' | 'B') =>
          primeira.filter((l) => l.lado === lado).flatMap((l) => [l.azul, l.branco]).filter(Boolean).map((id) => nivel(id!));
        expect(Math.max(...doLado('A'))).toBeLessThanOrEqual(Math.min(...doLado('B')));
      });

      it('quem passa direto é o de menor nível de cada lado', () => {
        for (const lado of ['A', 'B'] as const) {
          const doLado = primeira.filter((l) => l.lado === lado);
          const byes = doLado.filter((l) => l.status === 'bye').map((l) => Number(l.azul!.slice(1)));
          const lutando = doLado.filter((l) => l.status !== 'bye').flatMap((l) => [l.azul, l.branco]).map((id) => Number(id!.slice(1)));
          if (byes.length && lutando.length) expect(Math.max(...byes)).toBeLessThan(Math.min(...lutando));
        }
      });

      it('confrontos da 1ª rodada são entre vizinhos de nível', () => {
        for (const l of primeira.filter((x) => x.status !== 'bye')) {
          const diff = Math.abs(Number(l.azul!.slice(1)) - Number(l.branco!.slice(1)));
          expect(diff).toBe(1);
        }
      });

      it('jogada até o fim: um campeão, cada atleta perde no máximo uma vez', () => {
        const fim = jogarTudo(chave, maiorNivelVence);
        const result = classificacao(fim)!;
        expect(result.campeao).toBe(`a${n}`);
        const derrotas = new Map<string, number>();
        for (const l of fim.lutas.filter((x) => x.status === 'finalizada')) {
          const perdedor = l.vencedor === l.azul ? l.branco! : l.azul!;
          derrotas.set(perdedor, (derrotas.get(perdedor) ?? 0) + 1);
        }
        expect([...derrotas.values()].every((d) => d === 1)).toBe(true);
        expect(derrotas.size).toBe(n - 1);
        expect(derrotas.has(result.campeao)).toBe(false);
      });

      it('dois bronzes (sem disputa de 3º)', () => {
        const fim = jogarTudo(chave, maiorNivelVence);
        expect(classificacao(fim)!.terceiros).toHaveLength(2);
      });
    });
  }
});

describe('lados e final', () => {
  it('campeão do lado A é azul e do lado B é branco na final', () => {
    const fim = jogarTudo(gerarChave(atletas(8)), maiorNivelVence);
    const final = fim.lutas.find((l) => l.id === 'final')!;
    expect(final.azul).toBe('a4');
    expect(final.branco).toBe('a8');
  });

  it('a final só fica pronta quando os dois lados terminam', () => {
    let chave = gerarChave(atletas(4));
    chave = registrarResultado(chave, 'A-1-1', 'a2', 'finalizacao');
    expect(chave.lutas.find((l) => l.id === 'final')!.status).toBe('aguardando');
    chave = registrarResultado(chave, 'B-1-1', 'a4', 'finalizacao');
    expect(chave.lutas.find((l) => l.id === 'final')!.status).toBe('pronta');
  });
});

describe('avisos de muitos byes', () => {
  it.each([5, 9, 17])('%i atletas geram aviso', (n) => expect(gerarChave(atletas(n)).avisos).toHaveLength(1));
  it.each([4, 7, 8, 15, 16, 30])('%i atletas não geram aviso', (n) => expect(gerarChave(atletas(n)).avisos).toHaveLength(0));
});

describe('chave de três', () => {
  it('os dois de nível mais próximo fazem a 1ª luta', () => {
    const chave = gerarChave([
      { id: 'x', nome: 'X', nivel: 0 },
      { id: 'y', nome: 'Y', nivel: 10 },
      { id: 'z', nome: 'Z', nivel: 11 },
    ]);
    const l1 = chave.lutas.find((l) => l.id === 'c3-1')!;
    expect([l1.azul, l1.branco].sort()).toEqual(['y', 'z']);
  });

  it('perdedor da 1ª enfrenta o terceiro; 3º lugar é quem perde a 2ª', () => {
    let chave = gerarChave(atletas(3)); // a1 x a2 primeiro, a3 espera
    chave = registrarResultado(chave, 'c3-1', 'a1', 'decisao');
    const l2 = chave.lutas.find((l) => l.id === 'c3-2')!;
    expect([l2.azul, l2.branco].sort()).toEqual(['a2', 'a3']);
    expect(l2.status).toBe('pronta');
    chave = registrarResultado(chave, 'c3-2', 'a2', 'decisao');
    chave = registrarResultado(chave, 'final', 'a2', 'finalizacao');
    expect(classificacao(chave)).toEqual({ campeao: 'a2', vice: 'a1', terceiros: ['a3'] });
  });
});

describe('melhor de três', () => {
  it('2 a 0 cancela a terceira luta', () => {
    let chave = gerarChave(atletas(2));
    chave = registrarResultado(chave, 'm3-1', 'a1', 'decisao');
    expect(chave.lutas.find((l) => l.id === 'm3-2')!.status).toBe('pronta');
    chave = registrarResultado(chave, 'm3-2', 'a1', 'decisao');
    expect(chave.lutas.find((l) => l.id === 'm3-3')!.status).toBe('cancelada');
    expect(classificacao(chave)).toEqual({ campeao: 'a1', vice: 'a2', terceiros: [] });
  });

  it('1 a 1 libera a terceira luta', () => {
    let chave = gerarChave(atletas(2));
    chave = registrarResultado(chave, 'm3-1', 'a1', 'decisao');
    chave = registrarResultado(chave, 'm3-2', 'a2', 'decisao');
    expect(chave.lutas.find((l) => l.id === 'm3-3')!.status).toBe('pronta');
    expect(classificacao(chave)).toBeNull();
    chave = registrarResultado(chave, 'm3-3', 'a2', 'finalizacao');
    expect(classificacao(chave)!.campeao).toBe('a2');
  });

  it('desfazer a 2ª luta volta a 3ª para aguardando', () => {
    let chave = gerarChave(atletas(2));
    chave = registrarResultado(chave, 'm3-1', 'a1', 'decisao');
    chave = registrarResultado(chave, 'm3-2', 'a1', 'decisao');
    chave = desfazerResultado(chave, 'm3-2');
    expect(chave.lutas.find((l) => l.id === 'm3-2')!.status).toBe('pronta');
    expect(chave.lutas.find((l) => l.id === 'm3-3')!.status).toBe('aguardando');
    expect(classificacao(chave)).toBeNull();
  });
});

describe('registrar resultado', () => {
  it('não altera a chave original', () => {
    const chave = gerarChave(atletas(4));
    const copia = JSON.stringify(chave);
    registrarResultado(chave, 'A-1-1', 'a1', 'decisao');
    expect(JSON.stringify(chave)).toBe(copia);
  });

  it('recusa vencedor que não está na luta', () => {
    expect(() => registrarResultado(gerarChave(atletas(4)), 'A-1-1', 'a4', 'decisao')).toThrow(/vencedor/);
  });

  it('recusa luta que ainda não está pronta', () => {
    expect(() => registrarResultado(gerarChave(atletas(4)), 'final', 'a1', 'decisao')).toThrow(/não está pronta/);
  });

  it('recusa registrar duas vezes a mesma luta', () => {
    const chave = registrarResultado(gerarChave(atletas(4)), 'A-1-1', 'a1', 'decisao');
    expect(() => registrarResultado(chave, 'A-1-1', 'a2', 'decisao')).toThrow(ErroChave);
  });

  it('aceita luta em andamento', () => {
    const chave = iniciarLuta(gerarChave(atletas(4)), 'A-1-1');
    expect(registrarResultado(chave, 'A-1-1', 'a1', 'decisao').lutas.find((l) => l.id === 'A-1-1')!.status).toBe('finalizada');
  });
});

describe('desfazer resultado', () => {
  it('limpa o vencedor da luta seguinte', () => {
    let chave = gerarChave(atletas(8));
    chave = registrarResultado(chave, 'A-1-1', 'a1', 'decisao');
    chave = registrarResultado(chave, 'A-1-2', 'a3', 'decisao');
    expect(chave.lutas.find((l) => l.id === 'A-2-1')!.status).toBe('pronta');
    chave = desfazerResultado(chave, 'A-1-1');
    const semi = chave.lutas.find((l) => l.id === 'A-2-1')!;
    expect(semi.azul).toBeNull();
    expect(semi.status).toBe('aguardando');
    expect(chave.lutas.find((l) => l.id === 'A-1-1')!.status).toBe('pronta');
  });

  it('bloqueia se a luta seguinte já começou', () => {
    let chave = gerarChave(atletas(8));
    chave = registrarResultado(chave, 'A-1-1', 'a1', 'decisao');
    chave = registrarResultado(chave, 'A-1-2', 'a3', 'decisao');
    chave = iniciarLuta(chave, 'A-2-1');
    expect(() => desfazerResultado(chave, 'A-1-1')).toThrow(/já começou/);
  });

  it('não desfaz um bye', () => {
    const chave = gerarChave(atletas(5));
    const bye = chave.lutas.find((l) => l.status === 'bye')!;
    expect(() => desfazerResultado(chave, bye.id)).toThrow(ErroChave);
  });
});

describe('fila de lutas', () => {
  it('começa pela 1ª rodada do lado A', () => {
    const fila = filaDeLutas(gerarChave(atletas(8)));
    expect(fila.map((l) => l.id)).toEqual(['A-1-1', 'A-1-2', 'B-1-1', 'B-1-2']);
  });
});

describe('nomes de rodada', () => {
  it('chave de 32', () => {
    const chave = gerarChave(atletas(30));
    expect([1, 2, 3, 4, 5].map((r) => nomeRodada(chave, r))).toEqual(['16 avos', 'Oitavas', 'Quartas', 'Semifinal', 'Final']);
  });
  it('chave de 8', () => {
    const chave = gerarChave(atletas(8));
    expect([1, 2, 3].map((r) => nomeRodada(chave, r))).toEqual(['Quartas', 'Semifinal', 'Final']);
  });
});

describe('regra especial da final', () => {
  it.each([
    [0, 'em-pe'],
    [3, 'em-pe'],
    [3.1, 'dentro-da-guarda'],
    [8, 'dentro-da-guarda'],
    [8.1, 'cem-quilos'],
    [14, 'cem-quilos'],
    [16.2, 'montada'],
  ])('diferença %f → %s', (dif, posicao) => expect(posicaoPorDiferenca(dif)).toBe(posicao));

  it('identifica o mais fraco e o mais forte entre os finalistas', () => {
    const lista: AtletaChave[] = [
      { id: 'julia', nome: 'Júlia', nivel: 1.8 },
      { id: 'ana', nome: 'Ana', nivel: -1.4 },
      { id: 'diego', nome: 'Diego', nivel: 15.6 },
      { id: 'bruno', nome: 'Bruno', nivel: 18 },
    ];
    const fim = jogarTudo(gerarChave(lista), (a, b) => (a === 'julia' || b === 'julia' ? 'julia' : a === 'bruno' || b === 'bruno' ? 'bruno' : a));
    // A final já terminou, mas a regra continua consultável.
    const regra = regraEspecialFinal(fim)!;
    expect(regra).toMatchObject({ maisFraco: 'julia', maisForte: 'bruno', diferenca: 16.2, posicao: 'montada' });
  });

  it('é nula enquanto a final não tem os dois finalistas', () => {
    expect(regraEspecialFinal(gerarChave(atletas(8)))).toBeNull();
  });

  it('o campeão do lado A pode vencer a final', () => {
    const fim = jogarTudo(gerarChave(atletas(8)), menorNivelVence);
    expect(classificacao(fim)!.campeao).toBe('a1');
  });
});

describe('garotas lutam entre si primeiro', () => {
  const g = (id: string, nivel: number): AtletaChave => ({ id, nome: id, nivel, sexo: 'F' });
  const m = (id: string, nivel: number): AtletaChave => ({ id, nome: id, nivel, sexo: 'M' });
  const r1 = (c: Chave) => c.lutas.filter((l) => l.rodada === 1);
  const sexoDe = (c: Chave, id: string | null) => c.atletas.find((a) => a.id === id)?.sexo;
  const mistas = (c: Chave) => r1(c).filter((l) => l.azul && l.branco && sexoDe(c, l.azul) !== sexoDe(c, l.branco));

  it('4 garotas e 4 garotos: nenhuma luta mista na 1ª rodada nem na 2ª', () => {
    // Uma garota forte e um garoto fraco: o nível sozinho os misturaria.
    const c = gerarChave([g('g1', -4), g('g2', -2), g('g3', 1), g('g4', 16), m('m1', -3), m('m2', 5), m('m3', 8), m('m4', 12)]);
    expect(mistas(c)).toEqual([]);
    let jogado = c;
    for (const l of r1(c)) jogado = registrarResultado(jogado, l.id, l.azul!, 'decisao');
    const r2 = jogado.lutas.filter((l) => l.rodada === 2);
    expect(r2.every((l) => sexoDe(jogado, l.azul) === sexoDe(jogado, l.branco))).toBe(true);
  });

  it('número ímpar de garotas: o bye vai para uma garota para as outras se enfrentarem', () => {
    // 3 garotas + 3 garotos = chave de 8 com 2 byes.
    const c = gerarChave([g('g1', -4), g('g2', -1), g('g3', 3), m('m1', 2), m('m2', 6), m('m3', 9)]);
    expect(mistas(c)).toEqual([]);
    const byes = c.lutas.filter((l) => l.status === 'bye').map((l) => sexoDe(c, l.azul));
    expect(byes).toContain('F');
  });

  it('2 garotas numa chave com byes: elas se enfrentam em vez de uma passar direto', () => {
    const c = gerarChave([g('g1', -4), g('g2', 0), m('m1', -3), m('m2', 6), m('m3', 9), m('m4', 11)]);
    const luta = r1(c).find((l) => l.azul === 'g1' || l.branco === 'g1')!;
    expect([luta.azul, luta.branco].sort()).toEqual(['g1', 'g2']);
  });

  it('uma garota só: cai com o garoto de menor nível do lado dela', () => {
    const c = gerarChave([g('g1', 2), m('m1', -3), m('m2', 0), m('m3', 6), m('m4', 9), m('m5', 11), m('m6', 13), m('m7', 15)]);
    const luta = r1(c).find((l) => l.azul === 'g1' || l.branco === 'g1')!;
    expect([luta.azul, luta.branco]).toContain('m1');
  });

  it('com sorteio aleatório as garotas continuam juntas', () => {
    let seed = 7;
    const aleatorio = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let t = 0; t < 30; t++) {
      const c = gerarChave(
        [g('g1', -4), g('g2', -2), g('g3', 5), g('g4', 12), m('m1', -1), m('m2', 3), m('m3', 7), m('m4', 9), m('m5', 14), m('m6', 18)],
        { aleatorio }
      );
      expect(mistas(c)).toEqual([]);
    }
  });

  it('sem sexo informado, a chave sai igual à de antes', () => {
    const semSexo = atletas(11);
    const comM = semSexo.map((a) => ({ ...a, sexo: 'M' as const }));
    const ids = (c: Chave) => c.lutas.map((l) => [l.id, l.azul, l.branco].join(':'));
    expect(ids(gerarChave(comM))).toEqual(ids(gerarChave(semSexo)));
  });
});
