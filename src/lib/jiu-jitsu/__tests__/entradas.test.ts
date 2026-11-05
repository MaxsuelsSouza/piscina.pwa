import { describe, expect, it } from 'vitest';
import {
  buscarLuta,
  classificacao,
  desfazerResultado,
  filaDeLutas,
  gerarChave,
  iniciarLuta,
  registrarResultado,
  registrarWO,
  regraEspecialFinal,
  textoRegraFinal,
  type AtletaChave,
  type Chave,
} from '../chave';
import { aceitaDesafio, ocuparVaga, opcoesDeEntrada, proporDesafio, responderDesafio, substituir } from '../entradas';

const atletas = (n: number, passo = 1): AtletaChave[] =>
  Array.from({ length: n }, (_, i) => ({ id: `a${i + 1}`, nome: `Atleta ${i + 1}`, nivel: (i + 1) * passo }));
const novo = (id: string, nivel: number): AtletaChave => ({ id, nome: id, nivel });

function vencerAzul(chave: Chave, lutaId: string) {
  return registrarResultado(chave, lutaId, buscarLuta(chave, lutaId).azul!, 'decisao');
}

describe('vaga de quem passou direto', () => {
  it('7 atletas: a5 (menor nível do lado B) passa direto; atrasado próximo ocupa a vaga sem desvantagem', () => {
    const chave = gerarChave(atletas(7)); // lado A: a1–a4; lado B: a5 (bye), a6 x a7
    const opcoes = opcoesDeEntrada(chave, novo('x', 5.5));
    expect(opcoes.vagas).toEqual([{ lutaId: 'B-1-1', ocupante: 'a5', diferenca: 0.5, permitida: true, mesmoSexo: true }]);
    expect(opcoes.recomendacao).toBe('vaga');

    const depois = ocuparVaga(chave, novo('x', 5.5), 'B-1-1');
    const luta = buscarLuta(depois, 'B-1-1');
    expect(luta).toMatchObject({ azul: 'a5', branco: 'x', status: 'pronta', emDesvantagem: null });
    expect(buscarLuta(depois, 'B-2-1').azul).toBeNull();
    expect(depois.atletas.find((a) => a.id === 'x')!.atrasado).toBe(true);
  });

  it('vaga não tem limite de nível: quem chega luta com quem passou direto', () => {
    const chave = gerarChave(atletas(7));
    const op = opcoesDeEntrada(chave, novo('x', 1));
    expect(op.vagas[0]).toMatchObject({ lutaId: 'B-1-1', permitida: true });
    expect(op.recomendacao).toBe('vaga');
    expect(buscarLuta(ocuparVaga(chave, novo('x', 1), 'B-1-1'), 'B-1-1')).toMatchObject({ azul: 'a5', branco: 'x', status: 'pronta' });
  });

  it('garota que chega prefere a vaga e o desafio de outra garota, mesmo com nível mais longe', () => {
    const lista: AtletaChave[] = [
      { id: 'g1', nome: 'g1', nivel: 10, sexo: 'F' },
      { id: 'm1', nome: 'm1', nivel: 0, sexo: 'M' },
      { id: 'm2', nome: 'm2', nivel: 2, sexo: 'M' },
      { id: 'm3', nome: 'm3', nivel: 4, sexo: 'M' },
      { id: 'm4', nome: 'm4', nivel: 6, sexo: 'M' },
      { id: 'm5', nome: 'm5', nivel: 8, sexo: 'M' },
    ];
    const chave = gerarChave(lista);
    const garota: AtletaChave = { id: 'x', nome: 'x', nivel: 0, sexo: 'F' };
    const op = opcoesDeEntrada(chave, garota);
    expect(op.vagas.length).toBeGreaterThan(1);
    expect(op.vagas[0]).toMatchObject({ ocupante: 'g1', mesmoSexo: true });
    expect(op.vagas.slice(1).every((v) => !v.mesmoSexo)).toBe(true);
    if (op.desafios.length) expect(op.desafios[0].desafiado).toBe('g1');
  });

  it('vaga fecha quando a luta seguinte de quem passou direto já começou', () => {
    let chave = gerarChave(atletas(7));
    chave = vencerAzul(chave, 'B-1-2'); // completa B-2-1 (a5 x venc)
    chave = iniciarLuta(chave, 'B-2-1');
    expect(opcoesDeEntrada(chave, novo('x', 5.5)).vagas).toEqual([]);
  });

  it('a chave continua jogável até o campeão', () => {
    let chave = ocuparVaga(gerarChave(atletas(7)), novo('x', 5.5), 'B-1-1');
    for (let i = 0; i < 20 && filaDeLutas(chave).length; i++) chave = vencerAzul(chave, filaDeLutas(chave)[0].id);
    expect(classificacao(chave)).not.toBeNull();
  });
});

describe('quando o desafio é permitido', () => {
  it('chave de 8 (começa nas quartas): quartas e semi sim, final não', () => {
    const chave = gerarChave(atletas(8));
    expect(aceitaDesafio(chave, buscarLuta(chave, 'A-1-1'))).toBe(true);
    expect(aceitaDesafio(chave, buscarLuta(chave, 'A-2-1'))).toBe(true);
    expect(aceitaDesafio(chave, buscarLuta(chave, 'final'))).toBe(false);
  });

  it('chave de 16 (começa nas oitavas): oitavas e quartas sim, semi não', () => {
    const chave = gerarChave(atletas(16));
    expect(aceitaDesafio(chave, buscarLuta(chave, 'A-1-1'))).toBe(true);
    expect(aceitaDesafio(chave, buscarLuta(chave, 'A-2-1'))).toBe(true);
    expect(aceitaDesafio(chave, buscarLuta(chave, 'A-3-1'))).toBe(false);
  });

  it('chave de 32: 16 avos, oitavas e quartas sim; semi não', () => {
    const chave = gerarChave(atletas(30));
    // A-1-1 é a luta de quem passa direto; usamos a A-1-2.
    expect(['A-1-2', 'A-2-1', 'A-3-1', 'A-4-1'].map((id) => aceitaDesafio(chave, buscarLuta(chave, id)))).toEqual([true, true, true, false]);
  });

  it('não em luta que já começou', () => {
    const chave = iniciarLuta(gerarChave(atletas(8)), 'A-1-1');
    expect(aceitaDesafio(chave, buscarLuta(chave, 'A-1-1'))).toBe(false);
  });
});

describe('desafio de entrada', () => {
  it('propor → aceitar → lutar: o vencedor fica com o lugar, atrasado em desvantagem', () => {
    let chave = gerarChave(atletas(8));
    chave = proporDesafio(chave, novo('x', 3.2), 'A-1-2', 'azul'); // desafia a3
    const desafio = buscarLuta(chave, 'E-1');
    expect(desafio).toMatchObject({ status: 'proposta', azul: 'a3', branco: 'x', emDesvantagem: 'x', tipo: 'desafio' });
    // Enquanto espera resposta, a luta desafiada não pode começar.
    expect(() => iniciarLuta(chave, 'A-1-2')).toThrow(/desafio/);

    chave = responderDesafio(chave, 'E-1', true);
    expect(buscarLuta(chave, 'A-1-2')).toMatchObject({ azul: null, status: 'aguardando' });
    expect(filaDeLutas(chave)[0].id).toBe('E-1'); // desafio vai antes

    chave = registrarResultado(chave, 'E-1', 'x', 'finalizacao');
    expect(buscarLuta(chave, 'A-1-2')).toMatchObject({ azul: 'x', status: 'pronta' });
  });

  it('recusado: nada muda na chave', () => {
    let chave = gerarChave(atletas(8));
    chave = proporDesafio(chave, novo('x', 3.2), 'A-1-2', 'azul');
    chave = responderDesafio(chave, 'E-1', false);
    expect(buscarLuta(chave, 'E-1').status).toBe('recusada');
    expect(buscarLuta(chave, 'A-1-2')).toMatchObject({ azul: 'a3', status: 'pronta' });
  });

  it('opções sugerem o desafiado de nível mais próximo', () => {
    const op = opcoesDeEntrada(gerarChave(atletas(8)), novo('x', 6.1));
    expect(op.desafios[0]).toMatchObject({ desafiado: 'a6', diferenca: 0.1 });
    expect(op.recomendacao).toBe('desafio'); // 8 atletas: sem vaga de bye
  });

  it('desfazer o resultado do desafio devolve o lugar à disputa', () => {
    let chave = responderDesafio(proporDesafio(gerarChave(atletas(8)), novo('x', 3.2), 'A-1-2', 'azul'), 'E-1', true);
    chave = registrarResultado(chave, 'E-1', 'a3', 'decisao');
    chave = desfazerResultado(chave, 'E-1');
    expect(buscarLuta(chave, 'A-1-2').azul).toBeNull();
    expect(buscarLuta(chave, 'E-1').status).toBe('pronta');
  });

  it('não deixa o mesmo atleta entrar duas vezes', () => {
    const chave = ocuparVaga(gerarChave(atletas(7)), novo('x', 5.5), 'B-1-1');
    expect(() => proporDesafio(chave, novo('x', 5.5), 'A-1-1', 'azul')).toThrow(/já está na chave/);
  });
});

describe('substituição e W.O.', () => {
  it('substituto assume o lugar; em desvantagem depois da 1ª rodada', () => {
    let chave = gerarChave(atletas(8));
    chave = vencerAzul(chave, 'A-1-1');
    chave = vencerAzul(chave, 'A-1-2'); // semi A: a1 x a3
    chave = substituir(chave, novo('x', 2), 'a3');
    expect(buscarLuta(chave, 'A-2-1')).toMatchObject({ azul: 'a1', branco: 'x', emDesvantagem: 'x' });
    expect(chave.desistentes).toEqual(['a3']);
  });

  it('na 1ª rodada, substituto entra sem desvantagem', () => {
    const chave = substituir(gerarChave(atletas(8)), novo('x', 2), 'a2');
    expect(buscarLuta(chave, 'A-1-1')).toMatchObject({ branco: 'x', emDesvantagem: null });
  });

  it('W.O. avança o presente e marca o ausente; desfazer traz de volta', () => {
    let chave = registrarWO(gerarChave(atletas(8)), 'A-1-1', 'a1');
    expect(buscarLuta(chave, 'A-1-1')).toMatchObject({ vencedor: 'a2', metodo: 'wo' });
    expect(chave.desistentes).toEqual(['a1']);
    chave = desfazerResultado(chave, 'A-1-1');
    expect(chave.desistentes).toEqual([]);
  });
});

describe('atrasado sem compensação na final', () => {
  it('se o mais fraco da final entrou atrasado, a final é em pé', () => {
    // Níveis 2, 4, ..., 14. Bye do lado B é a5 (nível 10); x entra com 7 (diferença 3, no limite).
    let chave = ocuparVaga(gerarChave(atletas(7, 2)), novo('x', 7), 'B-1-1');
    // x vence tudo no lado B; o lado A é vencido por a4 (nível 8), mais forte que x.
    const vencedor = (l: { azul: string | null; branco: string | null }) =>
      l.azul === 'x' || l.branco === 'x' ? 'x' : Number(l.azul!.slice(1)) > Number(l.branco!.slice(1)) ? l.azul! : l.branco!;
    for (let i = 0; i < 20; i++) {
      const prox = filaDeLutas(chave).find((l) => l.id !== 'final');
      if (!prox) break;
      chave = registrarResultado(chave, prox.id, vencedor(prox), 'decisao');
    }
    const regra = regraEspecialFinal(chave)!;
    expect(regra).toMatchObject({ maisFraco: 'x', semCompensacao: true, posicao: 'em-pe' });
    expect(textoRegraFinal(regra, (id) => id)).toMatch(/sem compensação/);
  });
});
