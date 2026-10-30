import { describe, expect, it } from 'vitest';
import { gerarChave } from '../chave';
import { novaChaveDoc, type AtletaSnapshot, type ChaveDoc } from '../chaves';
import {
  chamarParaArea,
  comecarLuta,
  configTatame,
  desfazerLuta,
  estadoTatame,
  finalizarLuta,
  pausarLuta,
  restanteMs,
  retomarLuta,
} from '../tatame';

/** Horário ISO a partir de segundos desde um marco fixo. */
const t = (seg: number) => new Date(Date.UTC(2026, 9, 30, 20, 0, 0) + seg * 1000).toISOString();

function doc(n = 8): ChaveDoc {
  const atletas: AtletaSnapshot[] = Array.from({ length: n }, (_, i) => ({
    id: `a${i + 1}`, nome: `Atleta ${i + 1}`, nivel: i + 1, sexo: 'M', faixa: 'branca', graus: 0, peso: 70,
  }));
  return { ...novaChaveDoc('Sexta', atletas.map((a) => a.id), 'uid', t(0)), atletas, chave: gerarChave(atletas) };
}

const area = (d: ChaveDoc, n: number, agora = t(0)) => estadoTatame(d, agora).areas[n - 1];
const azulDe = (d: ChaveDoc, lutaId: string) => d.chave!.lutas.find((l) => l.id === lutaId)!.azul!;

describe('configuração', () => {
  it('padrão: 3 áreas de 5 minutos', () => expect(configTatame(doc())).toEqual({ areas: 3, duracaoSeg: 300 }));
  it('chaves antigas sem config usam o padrão', () => expect(configTatame({})).toEqual({ areas: 3, duracaoSeg: 300 }));
});

describe('cronômetro', () => {
  it('conta pelo relógio, não por contador', () => {
    let d = chamarParaArea(doc(), 'A-1-1', 1);
    d = comecarLuta(d, 'A-1-1', t(0));
    // Celular "dormiu" 2 minutos: ao voltar, o tempo está certo.
    expect(area(d, 1, t(120)).restanteMs).toBe(180_000);
    expect(area(d, 1, t(120)).fase).toBe('rodando');
  });

  it('pausa congela o tempo e retomar desconta a pausa', () => {
    let d = comecarLuta(chamarParaArea(doc(), 'A-1-1', 1), 'A-1-1', t(0));
    d = pausarLuta(d, 'A-1-1', t(60));
    expect(area(d, 1, t(500)).restanteMs).toBe(240_000);
    expect(area(d, 1, t(500)).fase).toBe('pausada');
    d = retomarLuta(d, 'A-1-1', t(90));
    expect(area(d, 1, t(150)).restanteMs).toBe(180_000); // 60s antes + 60s depois
  });

  it('chega a zero e marca tempo esgotado, sem ficar negativo', () => {
    const d = comecarLuta(chamarParaArea(doc(), 'A-1-1', 1), 'A-1-1', t(0));
    expect(area(d, 1, t(301)).restanteMs).toBe(0);
    expect(area(d, 1, t(301)).fase).toBe('tempo_esgotado');
  });

  it('antes do play mostra o tempo cheio', () => {
    const d = chamarParaArea(doc(), 'A-1-1', 2);
    expect(area(d, 2)).toMatchObject({ fase: 'aguardando', restanteMs: 300_000, lutaId: 'A-1-1' });
  });

  it('não pausa duas vezes nem retoma sem pausa', () => {
    let d = comecarLuta(chamarParaArea(doc(), 'A-1-1', 1), 'A-1-1', t(0));
    expect(() => retomarLuta(d, 'A-1-1', t(10))).toThrow(/não está pausada/);
    d = pausarLuta(d, 'A-1-1', t(10));
    expect(() => pausarLuta(d, 'A-1-1', t(20))).toThrow(/já está pausada/);
  });

  it('não pausa luta que não começou', () => {
    expect(() => pausarLuta(chamarParaArea(doc(), 'A-1-1', 1), 'A-1-1', t(0))).toThrow(/não está em andamento/);
  });

  it('restanteMs nunca passa da duração', () => {
    expect(restanteMs({ area: 1, duracaoSeg: 300, iniciadoEm: t(10), pausadoEm: null, pausadoMs: 0, finalizadoEm: null }, t(0))).toBe(300_000);
  });
});

describe('áreas', () => {
  it('três lutas em três áreas, quarta vai para a fila', () => {
    let d = doc();
    d = chamarParaArea(d, 'A-1-1', 1);
    d = chamarParaArea(d, 'A-1-2', 2);
    d = chamarParaArea(d, 'B-1-1', 3);
    const estado = estadoTatame(d, t(0));
    expect(estado.areas.map((a) => a.lutaId)).toEqual(['A-1-1', 'A-1-2', 'B-1-1']);
    expect(estado.fila.map((f) => f.lutaId)).toEqual(['B-1-2']);
  });

  it('recusa área ocupada, área inexistente e luta já chamada', () => {
    const d = chamarParaArea(doc(), 'A-1-1', 1);
    expect(() => chamarParaArea(d, 'A-1-2', 1)).toThrow(/ocupada/);
    expect(() => chamarParaArea(d, 'A-1-2', 4)).toThrow(/não existe/);
    expect(() => chamarParaArea(d, 'A-1-1', 2)).toThrow(/já está na área 1/);
  });

  it('recusa luta que não está pronta', () => {
    expect(() => chamarParaArea(doc(), 'final', 1)).toThrow(/não está pronta/);
  });

  it('resultado libera a área e mostra o último vencedor', () => {
    let d = comecarLuta(chamarParaArea(doc(), 'A-1-1', 1), 'A-1-1', t(0));
    d = finalizarLuta(d, 'A-1-1', azulDe(d, 'A-1-1'), 'finalizacao', t(200));
    const a1 = area(d, 1, t(201));
    expect(a1.fase).toBe('livre');
    expect(a1.ultimoResultado).toEqual({ lutaId: 'A-1-1', vencedor: 'Atleta 1', perdedor: 'Atleta 2' });
    // A área pode receber a próxima.
    expect(() => chamarParaArea(d, 'A-1-2', 1)).not.toThrow();
  });

  it('terminar pausada congela o tempo final no momento da pausa', () => {
    let d = comecarLuta(chamarParaArea(doc(), 'A-1-1', 1), 'A-1-1', t(0));
    d = pausarLuta(d, 'A-1-1', t(100));
    d = finalizarLuta(d, 'A-1-1', azulDe(d, 'A-1-1'), 'decisao', t(400));
    expect(d.cronometros!['A-1-1'].finalizadoEm).toBe(t(100));
  });

  it('desfazer devolve a luta para a fila e tira da área a seguinte que não começou', () => {
    let d = doc(4);
    d = comecarLuta(chamarParaArea(d, 'A-1-1', 1), 'A-1-1', t(0));
    d = finalizarLuta(d, 'A-1-1', azulDe(d, 'A-1-1'), 'decisao', t(10));
    d = comecarLuta(chamarParaArea(d, 'B-1-1', 2), 'B-1-1', t(10));
    d = finalizarLuta(d, 'B-1-1', azulDe(d, 'B-1-1'), 'decisao', t(20));
    d = chamarParaArea(d, 'final', 3);
    expect(area(d, 3, t(21)).fase).toBe('aguardando');

    d = desfazerLuta(d, 'A-1-1');
    expect(area(d, 3, t(22)).fase).toBe('livre');
    expect(estadoTatame(d, t(22)).fila.map((f) => f.lutaId)).toEqual(['A-1-1']);
    expect(d.cronometros!['A-1-1']).toBeUndefined();
  });

  it('play direto pela tela 4, sem área, também cronometra', () => {
    const d = comecarLuta(doc(), 'A-1-1', t(0));
    expect(d.cronometros!['A-1-1']).toMatchObject({ area: 0, iniciadoEm: t(0) });
    expect(estadoTatame(d, t(0)).areas.every((a) => a.fase === 'livre')).toBe(true);
  });

  it('estado inclui nomes e o relógio do servidor', () => {
    const estado = estadoTatame(chamarParaArea(doc(), 'A-1-1', 1), t(5));
    expect(estado.agora).toBe(t(5));
    expect(estado.areas[0]).toMatchObject({ azul: 'Atleta 1', branco: 'Atleta 2' });
  });
});
