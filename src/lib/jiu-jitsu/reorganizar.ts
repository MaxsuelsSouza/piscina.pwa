/**
 * Reorganizar a chave no meio da noite (funções puras).
 *
 * Quem ainda está na disputa pode sair; quem faltou (ou já tinha perdido) pode
 * entrar. As lutas já terminadas ficam guardadas em `fasesAnteriores` e uma
 * chave nova é sorteada só entre quem continua. Assim dá para corrigir a noite
 * sem perder o que aconteceu.
 */

import { classificacao, ErroChave, gerarChave, type Chave, type Luta } from './chave';
import { type AtletaSnapshot, type ChaveDoc } from './chaves';
import { perdedoresDaPrimeiraRodada } from './repescagem';
import { MAX_ATLETAS_CHAVE } from './schemas';

export type Situacao = 'na_disputa' | 'eliminado' | 'saiu';

/** Situação de cada atleta que já pisou na chave atual. */
export function situacaoDosAtletas(chave: Chave): Record<string, Situacao> {
  const situacao: Record<string, Situacao> = {};
  const participantes = chave.lutas
    .filter((l) => l.status !== 'recusada' && l.status !== 'proposta')
    .flatMap((l) => [l.azul, l.branco])
    .filter((x): x is string => !!x);
  for (const id of participantes) situacao[id] = 'na_disputa';

  // Na melhor de 3 ninguém sai antes do fim; nos outros formatos, quem perde
  // uma luta sem "segunda chance" (destino do perdedor) está fora.
  if (chave.formato !== 'melhor-de-3') {
    for (const l of chave.lutas) {
      if (l.status !== 'finalizada' || l.destinoPerdedor || !l.vencedor) continue;
      const perdedor = l.vencedor === l.azul ? l.branco : l.azul;
      if (perdedor) situacao[perdedor] = 'eliminado';
    }
  }
  for (const id of chave.desistentes ?? []) situacao[id] = 'saiu';
  return situacao;
}

export const naDisputa = (chave: Chave) =>
  Object.entries(situacaoDosAtletas(chave))
    .filter(([, s]) => s === 'na_disputa')
    .map(([id]) => id);

/** Por que não dá para reorganizar agora (ou null se dá). */
export function bloqueioReorganizar(doc: Pick<ChaveDoc, 'chave'>): string | null {
  if (!doc.chave) return 'A chave ainda não foi sorteada';
  if (classificacao(doc.chave)) return 'A chave já terminou';
  if (doc.chave.lutas.some((l) => l.status === 'em_andamento')) {
    return 'Tem luta rolando no tatame. Termine ou desfaça antes de reorganizar.';
  }
  return null;
}

export type Reorganizacao = {
  /** Quem continua (precisa estar na disputa). */
  manter: string[];
  /** Quem entra agora, já com a foto dos dados de hoje. */
  novos: AtletaSnapshot[];
  agora: string;
  aleatorio?: () => number;
};

export function reorganizarDoc(doc: ChaveDoc, { manter, novos, agora, aleatorio = Math.random }: Reorganizacao): ChaveDoc {
  const bloqueio = bloqueioReorganizar(doc);
  if (bloqueio) throw new ErroChave(bloqueio);
  const chave = doc.chave!;

  const vivos = new Set(naDisputa(chave));
  const fora = manter.filter((id) => !vivos.has(id));
  if (fora.length) throw new ErroChave('Só dá para manter quem ainda está na disputa');
  const novosIds = novos.map((a) => a.id);
  if (new Set([...manter, ...novosIds]).size !== manter.length + novosIds.length) {
    throw new ErroChave('Há lutadores repetidos');
  }
  const total = manter.length + novos.length;
  if (total < 2) throw new ErroChave('A chave precisa de pelo menos 2 lutadores');
  if (total > MAX_ATLETAS_CHAVE) throw new ErroChave(`A chave aceita no máximo ${MAX_ATLETAS_CHAVE} atletas`);

  const fotoDe = new Map(doc.atletas.map((a) => [a.id, a]));
  const mantidos = manter.map((id) => {
    const a = fotoDe.get(id);
    if (!a) throw new ErroChave('Atleta não está na chave');
    return a;
  });
  const participantes = [...mantidos, ...novos];

  // Lutas já terminadas viram histórico, com id único por fase.
  const fase = doc.fase ?? 1;
  const terminadas = chave.lutas.filter((l) => l.status === 'finalizada');
  const historico: Luta[] = terminadas.map((l) => ({
    ...l,
    id: `F${fase}-${l.id}`,
    destinoVencedor: null,
    destinoPerdedor: null,
  }));

  // Quem perdeu na 1ª rodada original continua com direito à repescagem.
  const principal = (doc.tipo ?? 'principal') === 'principal';
  const esperaRepescagem =
    principal && !doc.repescagemId && !doc.semRepescagem && fase === 1
      ? perdedoresDaPrimeiraRodada(chave).filter((id) => !participantes.some((p) => p.id === id))
      : [];
  const fila = [...new Set([...(doc.filaRepescagem ?? []), ...esperaRepescagem])].filter(
    (id) => !participantes.some((p) => p.id === id)
  );

  const atletas = [...doc.atletas.filter((a) => !novosIds.includes(a.id)), ...novos];
  const inscritos = [...new Set([...doc.inscritos, ...novosIds])];

  return {
    ...doc,
    atletas,
    inscritos,
    chave: gerarChave(participantes, { aleatorio }),
    cronometros: {},
    fase: terminadas.length ? fase + 1 : fase,
    fasesAnteriores: [...(doc.fasesAnteriores ?? []), ...historico],
    filaRepescagem: fila,
    updatedAt: agora,
  };
}
