/**
 * Modo tatame: áreas de luta e cronômetros (funções puras).
 *
 * O cronômetro não "conta" no servidor nem no celular: guardamos o horário
 * de início e o tempo total pausado, e o tempo restante é sempre calculado
 * a partir do relógio. Se a tela do celular apagar ou o app fechar, ao
 * voltar o tempo continua certo.
 *
 * Fluxo de uma área:
 *   livre → (chamar) aguardando play → (iniciar) rodando ⇄ pausada
 *         → (resultado) livre
 */

import { z } from 'zod';
import { buscarLuta, desfazerResultado, ErroChave, filaDeLutas, iniciarLuta, registrarResultado, type Luta } from './chave';
import type { ChaveDoc } from './chaves';
import type { MetodoVitoria } from './schemas';

export const AREAS_PADRAO = 3;
export const DURACAO_PADRAO_SEG = 5 * 60;
export const MAX_AREAS = 6;

export type ConfigTatame = { areas: number; duracaoSeg: number };

export type Cronometro = {
  area: number;
  duracaoSeg: number;
  /** ISO; null enquanto espera o play. */
  iniciadoEm: string | null;
  /** ISO; preenchido enquanto pausado. */
  pausadoEm: string | null;
  /** Soma das pausas já encerradas, em ms. */
  pausadoMs: number;
  /** ISO; quando o resultado foi registrado. */
  finalizadoEm: string | null;
};

export const ConfigTatameSchema = z.object({
  areas: z.number().int().min(1, 'Mínimo de 1 área').max(MAX_AREAS, `Máximo de ${MAX_AREAS} áreas`),
  duracaoSeg: z.number().int().min(60, 'Duração mínima de 1 minuto').max(20 * 60, 'Duração máxima de 20 minutos'),
});

export const ChamarSchema = z.object({ area: z.number().int().min(1) });
export const CronometroSchema = z.object({ acao: z.enum(['pausar', 'retomar']) });

export function configTatame(doc: Pick<ChaveDoc, 'tatame'>): ConfigTatame {
  return { areas: doc.tatame?.areas ?? AREAS_PADRAO, duracaoSeg: doc.tatame?.duracaoSeg ?? DURACAO_PADRAO_SEG };
}

// ─── Tempo ───────────────────────────────────────────────────────────────────

/** Milissegundos restantes do cronômetro no instante `agora`. */
export function restanteMs(c: Cronometro, agora: string): number {
  const total = c.duracaoSeg * 1000;
  if (!c.iniciadoEm) return total;
  const referencia = c.finalizadoEm ?? c.pausadoEm ?? agora;
  const decorrido = ms(referencia) - ms(c.iniciadoEm) - c.pausadoMs;
  return Math.max(0, Math.min(total, total - decorrido));
}

const ms = (iso: string) => new Date(iso).getTime();

// ─── Operações (recebem e devolvem o documento da chave) ─────────────────────

type Doc = ChaveDoc;

function exigirChave(doc: Doc) {
  if (!doc.chave) throw new ErroChave('A chave ainda não foi sorteada');
  return doc.chave;
}

/** Área ocupada = tem luta chamada (esperando play), rodando ou pausada. */
function lutaNaArea(doc: Doc, area: number): string | null {
  const chave = exigirChave(doc);
  for (const [lutaId, c] of Object.entries(doc.cronometros ?? {})) {
    if (c.area !== area || c.finalizadoEm) continue;
    const luta = chave.lutas.find((l) => l.id === lutaId);
    if (luta && (luta.status === 'pronta' || luta.status === 'em_andamento')) return lutaId;
  }
  return null;
}

/** Leva uma luta da fila para uma área, onde ela espera o play. */
export function chamarParaArea(doc: Doc, lutaId: string, area: number): Doc {
  const chave = exigirChave(doc);
  const { areas, duracaoSeg } = configTatame(doc);
  if (area < 1 || area > areas) throw new ErroChave(`Área ${area} não existe (são ${areas})`);

  const luta = buscarLuta(chave, lutaId);
  if (luta.status !== 'pronta') throw new ErroChave('Essa luta não está pronta para ir ao tatame');
  const atual = doc.cronometros?.[lutaId];
  if (atual && !atual.finalizadoEm) throw new ErroChave(`Essa luta já está na área ${atual.area}`);
  if (lutaNaArea(doc, area)) throw new ErroChave(`A área ${area} está ocupada`);

  const cronometro: Cronometro = { area, duracaoSeg, iniciadoEm: null, pausadoEm: null, pausadoMs: 0, finalizadoEm: null };
  return { ...doc, cronometros: { ...(doc.cronometros ?? {}), [lutaId]: cronometro } };
}

/** Dá o play: a luta começa e o cronômetro passa a correr. */
export function comecarLuta(doc: Doc, lutaId: string, agora: string): Doc {
  const chave = iniciarLuta(exigirChave(doc), lutaId);
  const existente = doc.cronometros?.[lutaId];
  const { duracaoSeg } = configTatame(doc);
  const cronometro: Cronometro = existente && !existente.finalizadoEm
    ? { ...existente, iniciadoEm: agora }
    : // Iniciada sem passar pela fila do tatame (ex.: tela 4): sem área.
      { area: 0, duracaoSeg, iniciadoEm: agora, pausadoEm: null, pausadoMs: 0, finalizadoEm: null };
  return { ...doc, chave, cronometros: { ...(doc.cronometros ?? {}), [lutaId]: cronometro } };
}

export function pausarLuta(doc: Doc, lutaId: string, agora: string): Doc {
  const c = cronometroRodando(doc, lutaId);
  if (c.pausadoEm) throw new ErroChave('A luta já está pausada');
  return comCronometro(doc, lutaId, { ...c, pausadoEm: agora });
}

export function retomarLuta(doc: Doc, lutaId: string, agora: string): Doc {
  const c = cronometroRodando(doc, lutaId);
  if (!c.pausadoEm) throw new ErroChave('A luta não está pausada');
  return comCronometro(doc, lutaId, { ...c, pausadoEm: null, pausadoMs: c.pausadoMs + (ms(agora) - ms(c.pausadoEm)) });
}

/** Registra o resultado, para o cronômetro e libera a área. */
export function finalizarLuta(doc: Doc, lutaId: string, vencedor: string, metodo: MetodoVitoria, agora: string): Doc {
  const chave = registrarResultado(exigirChave(doc), lutaId, vencedor, metodo);
  const c = doc.cronometros?.[lutaId];
  const proximo = { ...doc, chave };
  if (!c) return proximo;
  // Se terminou pausada, o tempo para no momento da pausa.
  return comCronometro(proximo, lutaId, { ...c, finalizadoEm: c.pausadoEm ?? agora });
}

/** Desfaz o resultado: a luta volta para a fila, sem área nem tempo. */
export function desfazerLuta(doc: Doc, lutaId: string): Doc {
  const chave = desfazerResultado(exigirChave(doc), lutaId);
  const cronometros = { ...(doc.cronometros ?? {}) };
  delete cronometros[lutaId];
  // A luta seguinte perdeu um atleta: se já tinha sido chamada para uma área
  // (sem ter começado), ela sai da área e volta a esperar.
  for (const [id, c] of Object.entries(cronometros)) {
    if (!c.iniciadoEm && buscarLuta(chave, id).status === 'aguardando') delete cronometros[id];
  }
  return { ...doc, chave, cronometros };
}

/**
 * Remove cronômetros de lutas chamadas para uma área que deixaram de estar
 * prontas (perderam um atleta por entrada, desafio ou desfazer) sem terem
 * começado. Elas voltam a esperar e a área fica livre.
 */
export function limparCronometrosOrfaos(doc: Doc): Doc {
  if (!doc.chave || !doc.cronometros) return doc;
  const cronometros = { ...doc.cronometros };
  for (const [id, c] of Object.entries(cronometros)) {
    const luta = doc.chave.lutas.find((l) => l.id === id);
    if (!c.iniciadoEm && (!luta || luta.status !== 'pronta')) delete cronometros[id];
  }
  return { ...doc, cronometros };
}

function cronometroRodando(doc: Doc, lutaId: string): Cronometro {
  const luta = buscarLuta(exigirChave(doc), lutaId);
  const c = doc.cronometros?.[lutaId];
  if (luta.status !== 'em_andamento' || !c?.iniciadoEm) throw new ErroChave('Essa luta não está em andamento');
  return c;
}

function comCronometro(doc: Doc, lutaId: string, c: Cronometro): Doc {
  return { ...doc, cronometros: { ...(doc.cronometros ?? {}), [lutaId]: c } };
}

// ─── Visão para a tela do tatame (4b) ────────────────────────────────────────

export type FaseArea = 'livre' | 'aguardando' | 'rodando' | 'pausada' | 'tempo_esgotado';

export type EstadoArea = {
  area: number;
  fase: FaseArea;
  lutaId: string | null;
  /** Nomes para exibir. */
  azul: string | null;
  branco: string | null;
  azulId: string | null;
  brancoId: string | null;
  cronometro: Cronometro | null;
  restanteMs: number | null;
  /** Último resultado registrado nesta área, para o card compacto. */
  ultimoResultado: { lutaId: string; vencedor: string; perdedor: string } | null;
};

export type EstadoTatame = {
  /** Relógio do servidor, para o celular corrigir o próprio relógio. */
  agora: string;
  config: ConfigTatame;
  areas: EstadoArea[];
  /** Lutas prontas que ainda não foram chamadas para uma área. */
  fila: { lutaId: string; azul: string; branco: string; rodada: number }[];
};

export function estadoTatame(doc: Doc, agora: string): EstadoTatame {
  const chave = exigirChave(doc);
  const config = configTatame(doc);
  const nome = (id: string | null) => (id ? doc.atletas.find((a) => a.id === id)?.nome ?? id : null);
  const cronos = Object.entries(doc.cronometros ?? {});

  const areas: EstadoArea[] = Array.from({ length: config.areas }, (_, i) => {
    const area = i + 1;
    const lutaId = lutaNaArea(doc, area);
    const ultimo = cronos
      .filter(([id, c]) => c.area === area && c.finalizadoEm && buscarLuta(chave, id).status === 'finalizada')
      .sort(([, a], [, b]) => b.finalizadoEm!.localeCompare(a.finalizadoEm!))[0];
    const ultimoResultado = ultimo ? resumoResultado(buscarLuta(chave, ultimo[0]), nome) : null;

    if (!lutaId) {
      return { area, fase: 'livre', lutaId: null, azul: null, branco: null, azulId: null, brancoId: null, cronometro: null, restanteMs: null, ultimoResultado };
    }
    const luta = buscarLuta(chave, lutaId);
    const c = doc.cronometros![lutaId];
    const restante = restanteMs(c, agora);
    const fase: FaseArea = !c.iniciadoEm ? 'aguardando' : c.pausadoEm ? 'pausada' : restante === 0 ? 'tempo_esgotado' : 'rodando';
    return {
      area, fase, lutaId, azul: nome(luta.azul), branco: nome(luta.branco), azulId: luta.azul, brancoId: luta.branco,
      cronometro: c, restanteMs: restante, ultimoResultado,
    };
  });

  const naArea = new Set(areas.map((a) => a.lutaId).filter(Boolean));
  const fila = filaDeLutas(chave)
    .filter((l) => !naArea.has(l.id))
    .map((l) => ({ lutaId: l.id, azul: nome(l.azul)!, branco: nome(l.branco)!, rodada: l.rodada }));

  return { agora, config, areas, fila };
}

function resumoResultado(luta: Luta, nome: (id: string | null) => string | null) {
  const perdedor = luta.vencedor === luta.azul ? luta.branco : luta.azul;
  return { lutaId: luta.id, vencedor: nome(luta.vencedor)!, perdedor: nome(perdedor)! };
}
