import { describe, expect, it } from 'vitest';
import { calcularNivel, composicaoNivel } from '../nivel';
import { aplicarAtualizacao, filtrarPorNome, novoLutadorDoc } from '../lutadores';
import { LutadorPatchSchema, LutadorSchema, normalizarBusca } from '../schemas';

describe('nível', () => {
  it('bate com os exemplos do mockup', () => {
    expect(calcularNivel({ faixa: 'branca', graus: 1, peso: 58, sexo: 'F' })).toBe(-1.4);
    expect(calcularNivel({ faixa: 'azul', graus: 2, peso: 76.5, sexo: 'M' })).toBe(12.3);
    expect(calcularNivel({ faixa: 'roxa', graus: 0, peso: 90, sexo: 'M' })).toBe(18);
  });

  it('mostra a composição', () => {
    expect(composicaoNivel({ faixa: 'branca', graus: 3, peso: 64, sexo: 'F' })).toEqual({
      faixa: 3,
      peso: 2.8,
      sexo: -4,
      total: 1.8,
    });
  });
});

describe('validação do lutador', () => {
  const valido = { nome: 'Júlia', sexo: 'F', peso: 64, faixa: 'branca', graus: 3 };

  it('aceita um lutador válido', () => expect(LutadorSchema.safeParse(valido).success).toBe(true));
  it('exige nome', () => expect(LutadorSchema.safeParse({ ...valido, nome: '  ' }).success).toBe(false));
  it('recusa 5 graus em faixa colorida', () => expect(LutadorSchema.safeParse({ ...valido, graus: 5 }).success).toBe(false));
  it('aceita 6 graus na preta', () =>
    expect(LutadorSchema.safeParse({ ...valido, faixa: 'preta', graus: 6 }).success).toBe(true));
  it('recusa peso absurdo', () => expect(LutadorSchema.safeParse({ ...valido, peso: 500 }).success).toBe(false));
  it('patch vazio é inválido', () => expect(LutadorPatchSchema.safeParse({}).success).toBe(false));
});

describe('atualização e histórico', () => {
  const base = novoLutadorDoc(
    { nome: 'Rafael', sexo: 'M', peso: 76.5, faixa: 'azul', graus: 2 },
    'uid-1',
    '2026-10-01T10:00:00.000Z'
  );

  it('registra mudança de grau e peso no histórico', () => {
    const depois = aplicarAtualizacao(base, { graus: 3, peso: 78 }, '2026-10-30T10:00:00.000Z');
    expect(depois.historico).toEqual([
      {
        data: '2026-10-30T10:00:00.000Z',
        alteracoes: [
          { campo: 'graus', de: 2, para: 3 },
          { campo: 'peso', de: 76.5, para: 78 },
        ],
      },
    ]);
  });

  it('não cria histórico quando só o nome muda', () => {
    const depois = aplicarAtualizacao(base, { nome: 'Rafael Lima' }, '2026-10-30T10:00:00.000Z');
    expect(depois.historico).toEqual([]);
    expect(depois.nomeBusca).toBe('rafael lima');
  });

  it('não altera o dono do registro', () => {
    expect(aplicarAtualizacao(base, { peso: 80 }, 'x').ownerUid).toBe('uid-1');
  });
});

describe('busca por nome', () => {
  const lista = ['João', 'Joana', 'Ana', 'Mariana', 'Otávio'].map((nome) => ({ nome, nomeBusca: normalizarBusca(nome) }));

  it('ignora acentos', () => expect(filtrarPorNome(lista, 'joao').map((l) => l.nome)).toEqual(['João']));
  it('quem começa com o termo vem primeiro', () =>
    expect(filtrarPorNome(lista, 'ana').map((l) => l.nome)).toEqual(['Ana', 'Joana', 'Mariana']));
  it('busca vazia devolve todos em ordem alfabética', () =>
    expect(filtrarPorNome(lista, '').map((l) => l.nome)).toEqual(['Ana', 'Joana', 'João', 'Mariana', 'Otávio']));
});
