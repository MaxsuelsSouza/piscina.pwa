import { describe, expect, it } from 'vitest';
import { gerarChave, iniciarLuta, registrarResultado, registrarWO, type Chave } from '../chave';
import { novaChaveDoc, statusDaChave, type AtletaSnapshot, type ChaveDoc } from '../chaves';
import { bloqueioReorganizar, naDisputa, reorganizarDoc, situacaoDosAtletas } from '../reorganizar';
import { idResultado } from '../resultados';
import { calcularRanking } from '../ranking';

const AGORA = '2026-10-30T22:00:00.000Z';

function atletas(n: number, prefixo = 'a'): AtletaSnapshot[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${prefixo}${i + 1}`, nome: `Atleta ${prefixo}${i + 1}`, nivel: (i + 1) * 2, sexo: 'M', faixa: 'branca', graus: 0, peso: 70,
  }));
}

function doc(n: number): ChaveDoc {
  const lista = atletas(n);
  return {
    ...novaChaveDoc('Sexta', lista.map((a) => a.id), 'uid', '2026-10-30T20:00:00.000Z'),
    atletas: lista,
    chave: gerarChave(lista),
    sorteadaEm: '2026-10-30T20:05:00.000Z',
  };
}

const vencerAzul = (c: Chave, id: string) => registrarResultado(c, id, c.lutas.find((l) => l.id === id)!.azul!, 'decisao');

describe('situação dos atletas', () => {
  it('quem perde sai da disputa; quem vence e quem não lutou continuam', () => {
    let c = doc(8).chave!;
    c = vencerAzul(c, 'A-1-1');
    const l = c.lutas.find((x) => x.id === 'A-1-1')!;
    const s = situacaoDosAtletas(c);
    expect(s[l.azul!]).toBe('na_disputa');
    expect(s[l.branco!]).toBe('eliminado');
    expect(naDisputa(c)).toHaveLength(7);
  });

  it('W.O. conta como saída; melhor de 3 não elimina ninguém antes do fim', () => {
    let c = doc(4).chave!;
    const l = c.lutas.find((x) => x.id === 'A-1-1')!;
    c = registrarWO(c, 'A-1-1', l.branco!);
    expect(situacaoDosAtletas(c)[l.branco!]).not.toBe('na_disputa');

    let m = doc(2).chave!;
    m = vencerAzul(m, m.lutas[0].id);
    expect(naDisputa(m)).toHaveLength(2);
  });
});

describe('reorganizar', () => {
  it('guarda as lutas feitas, sorteia o resto e sobe a fase', () => {
    const d = doc(8);
    let c = vencerAzul(d.chave!, 'A-1-1');
    c = vencerAzul(c, 'B-1-1');
    const atual = { ...d, chave: c };
    const vivos = naDisputa(c);
    const saiu = vivos[0];
    const novos = atletas(2, 'n');

    const r = reorganizarDoc(atual, { manter: vivos.filter((v) => v !== saiu), novos, agora: AGORA, aleatorio: () => 0.5 });
    expect(r.fase).toBe(2);
    expect(r.fasesAnteriores!.map((l) => l.id)).toEqual(['F1-A-1-1', 'F1-B-1-1']);
    expect(r.fasesAnteriores!.every((l) => !l.destinoVencedor && !l.destinoPerdedor)).toBe(true);
    const ids = r.chave!.atletas.map((a) => a.id);
    expect(ids).toHaveLength(vivos.length - 1 + 2);
    expect(ids).not.toContain(saiu);
    expect(ids).toEqual(expect.arrayContaining(['n1', 'n2']));
    // Todos (inclusive quem saiu e quem perdeu) seguem na lista de atletas, para o histórico.
    expect(r.atletas.map((a) => a.id)).toEqual(expect.arrayContaining(['a1', 'a8', 'n1', 'n2']));
    expect(r.inscritos).toEqual(expect.arrayContaining(['n1', 'n2']));
    expect(r.cronometros).toEqual({});
    expect(statusDaChave(r)).toBe('em_andamento');
  });

  it('sem nenhuma luta feita, só sorteia de novo (não muda a fase)', () => {
    const d = doc(6);
    const r = reorganizarDoc(d, { manter: naDisputa(d.chave!), novos: atletas(1, 'n'), agora: AGORA });
    expect(r.fase ?? 1).toBe(1);
    expect(r.fasesAnteriores).toEqual([]);
    expect(r.chave!.atletas).toHaveLength(7);
  });

  it('perdedores da 1ª rodada original vão para a fila da repescagem', () => {
    const d = doc(8);
    const c = vencerAzul(d.chave!, 'A-1-1');
    const perdedor = c.lutas.find((l) => l.id === 'A-1-1')!.branco!;
    const r = reorganizarDoc({ ...d, chave: c }, { manter: naDisputa(c), novos: [], agora: AGORA });
    expect(r.filaRepescagem).toContain(perdedor);
  });

  it('quem já perdeu pode voltar como novo', () => {
    const d = doc(4);
    const c = vencerAzul(d.chave!, 'A-1-1');
    const perdedor = d.atletas.find((a) => a.id === c.lutas.find((l) => l.id === 'A-1-1')!.branco)!;
    const r = reorganizarDoc({ ...d, chave: c }, { manter: naDisputa(c), novos: [perdedor], agora: AGORA });
    expect(r.chave!.atletas.map((a) => a.id)).toContain(perdedor.id);
    expect(r.atletas.filter((a) => a.id === perdedor.id)).toHaveLength(1);
  });

  it('bloqueios: luta rolando, chave terminada, gente fora da disputa, menos de 2, repetidos', () => {
    const d = doc(4);
    const rolando = { ...d, chave: iniciarLuta(d.chave!, 'A-1-1') };
    expect(bloqueioReorganizar(rolando)).toMatch(/rolando/);
    expect(() => reorganizarDoc(rolando, { manter: naDisputa(d.chave!), novos: [], agora: AGORA })).toThrow(/rolando/);

    let c = d.chave!;
    for (const id of ['A-1-1', 'B-1-1', 'final']) c = vencerAzul(c, id);
    expect(bloqueioReorganizar({ chave: c })).toMatch(/terminou/);

    const c2 = vencerAzul(d.chave!, 'A-1-1');
    const perdedor = c2.lutas.find((l) => l.id === 'A-1-1')!.branco!;
    const ok = { ...d, chave: c2 };
    expect(() => reorganizarDoc(ok, { manter: [perdedor, ...naDisputa(c2)], novos: [], agora: AGORA })).toThrow(/disputa/);
    expect(() => reorganizarDoc(ok, { manter: [naDisputa(c2)[0]], novos: [], agora: AGORA })).toThrow(/pelo menos 2/);
    const v = naDisputa(c2)[0];
    expect(() => reorganizarDoc(ok, { manter: [v, naDisputa(c2)[1]], novos: [d.atletas.find((a) => a.id === v)!], agora: AGORA })).toThrow(/repetidos/);
  });

  it('ranking soma as lutas de antes e de depois da reorganização', () => {
    const d = doc(8);
    const c = vencerAzul(d.chave!, 'A-1-1');
    let r = reorganizarDoc({ ...d, chave: c }, { manter: naDisputa(c), novos: [], agora: AGORA, aleatorio: () => 0.5 });
    r = { ...r, chave: vencerAzul(r.chave!, r.chave!.lutas.find((l) => l.status === 'pronta')!.id) };
    const rk = calcularRanking([{ id: 'c1', doc: r }], 2026);
    const linhas = Object.values(rk).flat();
    expect(linhas.reduce((n, l) => n + l.vitorias, 0)).toBe(2);
    // Participação conta uma vez por noite, mesmo aparecendo nas duas fases.
    expect(linhas.every((l) => l.noites === 1)).toBe(true);
    expect(linhas).toHaveLength(8);
  });
});

describe('id do resultado por fase', () => {
  it('fase 1 mantém o formato antigo; depois, a fase entra no id', () => {
    expect(idResultado('c1', 'A-1-1')).toBe('c1__A-1-1');
    expect(idResultado('c1', 'A-1-1', 1)).toBe('c1__A-1-1');
    expect(idResultado('c1', 'A-1-1', 2)).toBe('c1__f2__A-1-1');
  });
});
