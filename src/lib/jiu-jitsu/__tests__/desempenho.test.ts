import { describe, expect, it } from 'vitest';
import {
  AJUSTE_MAXIMO,
  aplicarDelta,
  calcularAjuste,
  confianca,
  DESEMPENHO_INICIAL,
  fatorCondicao,
  fatorMetodo,
  probabilidadeVitoria,
  reverterDelta,
  tendencia,
  type Desempenho,
  type EntradaAjuste,
} from '../desempenho';

const experiente: Desempenho = { ajuste: 0, lutas: 10, vitorias: 5, atualizadoEm: null };

function luta(parcial: Partial<EntradaAjuste> = {}): EntradaAjuste {
  return {
    vencedor: { nivel: 5, desempenho: experiente },
    perdedor: { nivel: 5, desempenho: experiente },
    metodo: 'decisao',
    duracaoSeg: 300,
    duracaoTotalSeg: 300,
    condicao: 'normal',
    ...parcial,
  };
}

describe('probabilidade', () => {
  it('níveis iguais: 50%', () => expect(probabilidadeVitoria(5, 5)).toBe(0.5));
  it('mais nível, mais chance', () => expect(probabilidadeVitoria(8, 5)).toBeGreaterThan(0.7));
  it('é simétrica', () => expect(probabilidadeVitoria(3, 9) + probabilidadeVitoria(9, 3)).toBeCloseTo(1));
});

describe('quanto o ajuste se move', () => {
  it('vencer quem tinha mais nível rende mais que vencer quem tinha menos', () => {
    const zebra = calcularAjuste(luta({ vencedor: { nivel: 2, desempenho: experiente }, perdedor: { nivel: 8, desempenho: experiente } }));
    const esperado = calcularAjuste(luta({ vencedor: { nivel: 8, desempenho: experiente }, perdedor: { nivel: 2, desempenho: experiente } }));
    expect(zebra.deltaVencedor).toBeGreaterThan(esperado.deltaVencedor * 3);
  });

  it('o perdedor cai o mesmo que o vencedor sobe (mesma experiência)', () => {
    const r = calcularAjuste(luta());
    expect(r.deltaPerdedor).toBe(-r.deltaVencedor);
  });

  it('finalização rápida pesa mais que finalização, que pesa mais que decisão', () => {
    const decisao = calcularAjuste(luta()).deltaVencedor;
    const finalizacao = calcularAjuste(luta({ metodo: 'finalizacao', duracaoSeg: 200 })).deltaVencedor;
    const rapida = calcularAjuste(luta({ metodo: 'finalizacao', duracaoSeg: 60 })).deltaVencedor;
    expect(finalizacao).toBeGreaterThan(decisao);
    expect(rapida).toBeGreaterThan(finalizacao);
  });

  it('luta desigual vale metade e W.O. não vale nada', () => {
    const normal = calcularAjuste(luta()).deltaVencedor;
    expect(calcularAjuste(luta({ condicao: 'desvantagem' })).deltaVencedor).toBeCloseTo(normal / 2, 1);
    expect(calcularAjuste(luta({ condicao: 'regra_final' })).deltaVencedor).toBeCloseTo(normal / 2, 1);
    expect(calcularAjuste(luta({ condicao: 'wo' })).deltaVencedor).toBe(0);
  });

  it('as primeiras lutas mexem menos', () => {
    const novato = calcularAjuste(luta({ vencedor: { nivel: 5, desempenho: DESEMPENHO_INICIAL } })).deltaVencedor;
    const veterano = calcularAjuste(luta()).deltaVencedor;
    expect(novato).toBeLessThan(veterano);
    expect(confianca(0)).toBeCloseTo(1 / 3);
    expect(confianca(4)).toBe(1);
  });

  it('exemplo do mockup: Ana (−1,4) finaliza Júlia (1,8) rápido, ambas com experiência', () => {
    const r = calcularAjuste(luta({
      vencedor: { nivel: -1.4, desempenho: experiente },
      perdedor: { nivel: 1.8, desempenho: experiente },
      metodo: 'finalizacao',
      duracaoSeg: 100,
    }));
    expect(r.chanceVencedor).toBeCloseTo(0.256, 2);
    expect(r.deltaVencedor).toBeCloseTo(1.4, 1);
  });
});

describe('aplicar e reverter', () => {
  it('aplica e conta lutas e vitórias', () => {
    const d = aplicarDelta(DESEMPENHO_INICIAL, 0.8, true, 'agora');
    expect(d).toEqual({ ajuste: 0.8, lutas: 1, vitorias: 1, atualizadoEm: 'agora' });
  });

  it('nunca passa do teto', () => {
    let d = DESEMPENHO_INICIAL;
    for (let i = 0; i < 30; i++) d = aplicarDelta(d, 1.5, true, 'x');
    expect(d.ajuste).toBe(AJUSTE_MAXIMO);
    for (let i = 0; i < 60; i++) d = aplicarDelta(d, -1.5, false, 'x');
    expect(d.ajuste).toBe(-AJUSTE_MAXIMO);
  });

  it('reverter desfaz exatamente o que foi aplicado', () => {
    const antes: Desempenho = { ajuste: 1.2, lutas: 3, vitorias: 2, atualizadoEm: 'a' };
    const depois = aplicarDelta(antes, -0.7, false, 'b');
    expect(reverterDelta(depois, -0.7, false, 'c')).toEqual({ ...antes, atualizadoEm: 'c' });
  });

  it('W.O. (venceu = null) não altera nada', () => {
    expect(aplicarDelta(experiente, 2, null, 'x')).toBe(experiente);
  });
});

describe('fatores e tendência', () => {
  it('fatores', () => {
    expect(fatorMetodo('decisao', 10, 300)).toBe(1);
    expect(fatorMetodo('finalizacao', null, null)).toBe(1.1);
    expect(fatorCondicao('normal')).toBe(1);
  });
  it.each([
    [0.6, 'alta'],
    [0.2, 'estavel'],
    [-0.5, 'baixa'],
  ])('ajuste %f → %s', (a, t) => expect(tendencia(a)).toBe(t));
});
