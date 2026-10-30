/**
 * Entrada de atletas depois do sorteio (funções puras sobre a Chave).
 *
 * - Vaga de quem passou direto: o atrasado vira adversário de quem ia passar
 *   direto na 1ª rodada. Sem desvantagem (não pulou rodada). Só se a
 *   diferença de nível for até LIMITE_DIFERENCA_VAGA.
 * - Desafio de entrada: o atrasado desafia quem ocupa um lugar numa luta que
 *   ainda não começou. O desafiado pode recusar. Quem vencer fica com o lugar.
 *   O atrasado começa em desvantagem (adversário nos 100 kg).
 * - Substituição: o atrasado assume o lugar de quem desistiu, do ponto onde a
 *   pessoa parou. Em desvantagem se for depois da 1ª rodada.
 *
 * Quem entra atrasado não recebe compensação (nem na final).
 */

import {
  buscarLuta,
  ErroChave,
  nomeRodada,
  type AtletaChave,
  type Chave,
  type Cor,
  type Luta,
} from './chave';

export const LIMITE_DIFERENCA_VAGA = 3;
/** Rodadas com pelo menos este número de vagas aceitam desafio ("até as quartas"). */
export const VAGAS_MINIMAS_DESAFIO = 8;

export type OpcaoVaga = { lutaId: string; ocupante: string; diferenca: number; permitida: boolean };
export type OpcaoDesafio = { lutaId: string; cor: Cor; desafiado: string; diferenca: number; rodada: string };
export type OpcaoSubstituicao = { lutaId: string; atleta: string; rodada: string; comDesvantagem: boolean };
export type TipoEntrada = 'vaga' | 'desafio' | 'substituir' | 'repescagem';

export type OpcoesEntrada = {
  vagas: OpcaoVaga[];
  desafios: OpcaoDesafio[];
  substituicoes: OpcaoSubstituicao[];
  recomendacao: TipoEntrada;
};

// ─── Regras de quando cada entrada é possível ─────────────────────────────────

const naoComecou = (l: Luta) => l.status === 'aguardando' || l.status === 'pronta';

function temDesafioPendente(chave: Chave, lutaId: string) {
  return chave.lutas.some((l) => l.status === 'proposta' && l.destinoVencedor?.lutaId === lutaId);
}

/**
 * Desafio vale até as quartas (rodadas com 8+ vagas) ou nas duas primeiras
 * rodadas da chave — assim a chave que já começa nas quartas aceita desafio
 * também na semi. Nunca na final, e só na eliminatória.
 */
export function aceitaDesafio(chave: Chave, luta: Luta): boolean {
  if (chave.formato !== 'eliminatoria' || luta.final || luta.tipo === 'desafio') return false;
  if (!naoComecou(luta) || temDesafioPendente(chave, luta.id)) return false;
  const vagas = chave.tamanho / 2 ** (luta.rodada - 1);
  return vagas >= VAGAS_MINIMAS_DESAFIO || luta.rodada <= 2;
}

function nivelDe(chave: Chave, id: string) {
  const a = chave.atletas.find((x) => x.id === id);
  if (!a) throw new ErroChave('Atleta não está na chave');
  return a.nivel;
}

const dif = (a: number, b: number) => Math.round(Math.abs(a - b) * 10) / 10;

function exigirNovo(chave: Chave, atleta: AtletaChave) {
  const existente = chave.atletas.find((a) => a.id === atleta.id);
  // Pode reaproveitar quem teve o desafio recusado; quem já luta, não.
  if (existente && chave.lutas.some((l) => (l.azul === atleta.id || l.branco === atleta.id) && l.status !== 'recusada')) {
    throw new ErroChave('Esse atleta já está na chave');
  }
}

function comAtleta(chave: Chave, atleta: AtletaChave): Chave {
  const outros = chave.atletas.filter((a) => a.id !== atleta.id);
  const atletas = [...outros, { ...atleta, atrasado: true }].sort((a, b) => a.nivel - b.nivel);
  return { ...chave, atletas };
}

function clonarLutas(chave: Chave): Chave {
  return {
    ...chave,
    lutas: chave.lutas.map((l) => ({
      ...l,
      destinoVencedor: l.destinoVencedor && { ...l.destinoVencedor },
      destinoPerdedor: l.destinoPerdedor && { ...l.destinoPerdedor },
    })),
  };
}

// ─── Opções para a tela "Chegou alguém" ──────────────────────────────────────

export function opcoesDeEntrada(chave: Chave, atleta: AtletaChave): OpcoesEntrada {
  const vagas: OpcaoVaga[] = chave.lutas
    .filter((l) => l.status === 'bye' && l.rodada === 1 && l.destinoVencedor)
    .filter((l) => {
      const seguinte = buscarLuta(chave, l.destinoVencedor!.lutaId);
      return naoComecou(seguinte) && !temDesafioPendente(chave, seguinte.id);
    })
    .map((l) => {
      const diferenca = dif(nivelDe(chave, l.azul!), atleta.nivel);
      return { lutaId: l.id, ocupante: l.azul!, diferenca, permitida: diferenca <= LIMITE_DIFERENCA_VAGA };
    })
    .sort((a, b) => a.diferenca - b.diferenca);

  const desafios: OpcaoDesafio[] = chave.lutas
    .filter((l) => aceitaDesafio(chave, l))
    .flatMap((l) =>
      (['azul', 'branco'] as const)
        .filter((cor) => l[cor] && !chave.atletas.find((a) => a.id === l[cor])?.atrasado)
        .map((cor) => ({
          lutaId: l.id,
          cor,
          desafiado: l[cor]!,
          diferenca: dif(nivelDe(chave, l[cor]!), atleta.nivel),
          rodada: nomeRodada(chave, l.rodada),
        }))
    )
    .sort((a, b) => a.diferenca - b.diferenca);

  const substituicoes: OpcaoSubstituicao[] = chave.lutas
    .filter((l) => naoComecou(l) && l.status !== 'proposta')
    .flatMap((l) =>
      (['azul', 'branco'] as const)
        .filter((cor) => l[cor])
        .map((cor) => ({ lutaId: l.id, atleta: l[cor]!, rodada: nomeRodada(chave, l.rodada), comDesvantagem: l.rodada > 1 }))
    );

  const recomendacao: TipoEntrada = vagas.some((v) => v.permitida)
    ? 'vaga'
    : desafios.length > 0
      ? 'desafio'
      : 'repescagem';

  return { vagas, desafios, substituicoes, recomendacao };
}

// ─── Operações ───────────────────────────────────────────────────────────────

/** Atrasado ocupa a vaga de quem ia passar direto na 1ª rodada. */
export function ocuparVaga(chave: Chave, atleta: AtletaChave, byeLutaId: string): Chave {
  exigirNovo(chave, atleta);
  const opcao = opcoesDeEntrada(chave, atleta).vagas.find((v) => v.lutaId === byeLutaId);
  if (!opcao) throw new ErroChave('Essa vaga não está mais aberta');
  if (!opcao.permitida) {
    throw new ErroChave(`Diferença de nível ${opcao.diferenca} acima do limite de ${LIMITE_DIFERENCA_VAGA} para essa vaga`);
  }

  const proxima = clonarLutas(comAtleta(chave, atleta));
  const bye = buscarLuta(proxima, byeLutaId);
  const seguinte = buscarLuta(proxima, bye.destinoVencedor!.lutaId);
  seguinte[bye.destinoVencedor!.cor] = null;
  seguinte.status = 'aguardando';
  Object.assign(bye, { branco: atleta.id, status: 'pronta', vencedor: null, metodo: null, emDesvantagem: null });
  return proxima;
}

/** Cria a luta de desafio, que espera a resposta do desafiado. */
export function proporDesafio(chave: Chave, atleta: AtletaChave, lutaId: string, cor: Cor): Chave {
  exigirNovo(chave, atleta);
  const alvo = buscarLuta(chave, lutaId);
  if (!aceitaDesafio(chave, alvo)) throw new ErroChave('Essa luta não aceita mais desafio de entrada');
  const desafiado = alvo[cor];
  if (!desafiado) throw new ErroChave('Não há ninguém nesse lugar para desafiar');

  const proxima = clonarLutas(comAtleta(chave, atleta));
  const numero = proxima.lutas.filter((l) => l.tipo === 'desafio').length + 1;
  proxima.lutas.push({
    id: `E-${numero}`,
    rodada: alvo.rodada,
    ordem: numero,
    lado: alvo.lado,
    final: false,
    azul: desafiado,
    branco: atleta.id,
    status: 'proposta',
    vencedor: null,
    metodo: null,
    destinoVencedor: { lutaId, cor },
    destinoPerdedor: null,
    tipo: 'desafio',
    emDesvantagem: atleta.id,
  });
  return proxima;
}

/** Desafiado aceita (vira luta) ou recusa (o atrasado fica de fora da chave). */
export function responderDesafio(chave: Chave, desafioId: string, aceitar: boolean): Chave {
  const desafio = buscarLuta(chave, desafioId);
  if (desafio.status !== 'proposta') throw new ErroChave('Esse desafio não está esperando resposta');

  const proxima = clonarLutas(chave);
  const d = buscarLuta(proxima, desafioId);
  if (!aceitar) {
    d.status = 'recusada';
    return proxima;
  }
  const alvo = buscarLuta(proxima, d.destinoVencedor!.lutaId);
  if (!naoComecou(alvo)) throw new ErroChave('A luta desafiada já começou');
  // O lugar fica em disputa até o desafio acabar.
  alvo[d.destinoVencedor!.cor] = null;
  alvo.status = 'aguardando';
  d.status = 'pronta';
  return proxima;
}

/** Atrasado assume o lugar de quem desistiu, numa luta que ainda não começou. */
export function substituir(chave: Chave, atleta: AtletaChave, ausenteId: string): Chave {
  exigirNovo(chave, atleta);
  const luta = chave.lutas.find(
    (l) => naoComecou(l) && l.status !== 'proposta' && (l.azul === ausenteId || l.branco === ausenteId)
  );
  if (!luta) throw new ErroChave('Esse atleta não tem luta pendente para ser substituído');

  const proxima = clonarLutas(comAtleta(chave, atleta));
  const alvo = buscarLuta(proxima, luta.id);
  const cor: Cor = alvo.azul === ausenteId ? 'azul' : 'branco';
  alvo[cor] = atleta.id;
  alvo.emDesvantagem = alvo.rodada > 1 ? atleta.id : null;
  // Desafios pendentes contra quem saiu deixam de fazer sentido.
  for (const l of proxima.lutas) {
    if (l.status === 'proposta' && l.azul === ausenteId) l.status = 'recusada';
  }
  return { ...proxima, desistentes: [...(proxima.desistentes ?? []), ausenteId] };
}
