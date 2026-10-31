/**
 * Registro de resultados com efeitos colaterais (somente servidor):
 * - atualiza a chave (e o cronômetro/área do tatame);
 * - grava a luta na tabela `jj_resultados` (vencedor, perdedor, método,
 *   tempo até vencer, condição e níveis da hora);
 * - atualiza o ajuste de desempenho dos dois lutadores;
 * - sorteia a repescagem quando a 1ª rodada do absoluto termina.
 *
 * Tudo numa única transação: ou acontece tudo, ou nada.
 */

import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore';
import { buscarLuta, gerarChave, regraEspecialFinal, registrarWO, type Chave, type Luta } from './chave';
import { COLECAO_CHAVES, novaChaveDoc, snapshotAtleta, type ChaveDoc } from './chaves';
import { aplicarDelta, calcularAjuste, reverterDelta, type CondicaoLuta } from './desempenho';
import { ErroHttp } from './http';
import { COLECAO_LUTADORES, desempenhoDe, type LutadorDoc } from './lutadores';
import { lerChaveDoUsuario, refChave } from './repositorio';
import { deveGerarRepescagem, perdedoresDaPrimeiraRodada } from './repescagem';
import type { MetodoLuta, MetodoVitoria } from './schemas';
import { desfazerLuta, finalizarLuta, limparCronometrosOrfaos } from './tatame';

export const COLECAO_RESULTADOS = 'jj_resultados';

export type ResultadoDoc = {
  ownerUid: string;
  chaveId: string;
  tipoChave: 'principal' | 'repescagem';
  lutaId: string;
  data: string;
  vencedorId: string;
  perdedorId: string;
  vencedorNome: string;
  perdedorNome: string;
  metodo: MetodoLuta;
  /** Segundos de luta até o resultado (sem pausas); null se não cronometrada. */
  duracaoSeg: number | null;
  duracaoTotalSeg: number | null;
  condicao: CondicaoLuta;
  nivelVencedor: number;
  nivelPerdedor: number;
  chanceVencedor: number;
  deltaVencedor: number;
  deltaPerdedor: number;
};

/** Id do resultado; depois de reorganizar a chave, a fase entra no id (as lutas recomeçam com os mesmos nomes). */
export const idResultado = (chaveId: string, lutaId: string, fase = 1) =>
  fase > 1 ? `${chaveId}__f${fase}__${lutaId}` : `${chaveId}__${lutaId}`;
const refLutador = (db: Firestore, id: string) => db.collection(COLECAO_LUTADORES).doc(id) as DocumentReference<LutadorDoc>;

/** Condição da luta para o peso no desempenho. */
export function condicaoDaLuta(doc: ChaveDoc, chaveAntes: Chave, luta: Luta, metodo: MetodoLuta): CondicaoLuta {
  if (metodo === 'wo') return 'wo';
  if (luta.emDesvantagem) return 'desvantagem';
  if (luta.final && (doc.tipo ?? 'principal') === 'principal') {
    const regra = regraEspecialFinal(chaveAntes);
    if (regra && regra.posicao !== 'em-pe') return 'regra_final';
  }
  return 'normal';
}

function duracaoDe(doc: ChaveDoc, lutaId: string): { duracaoSeg: number | null; duracaoTotalSeg: number | null } {
  const c = doc.cronometros?.[lutaId];
  if (!c?.iniciadoEm || !c.finalizadoEm) return { duracaoSeg: null, duracaoTotalSeg: c?.duracaoSeg ?? null };
  const ms = new Date(c.finalizadoEm).getTime() - new Date(c.iniciadoEm).getTime() - c.pausadoMs;
  // Resultado registrado depois do tempo esgotar não conta o tempo extra.
  return { duracaoSeg: Math.min(c.duracaoSeg, Math.max(0, Math.round(ms / 1000))), duracaoTotalSeg: c.duracaoSeg };
}

async function lerLutadores(tx: Transaction, db: Firestore, ids: string[], uid: string) {
  const unicos = [...new Set(ids)];
  if (!unicos.length) return new Map<string, LutadorDoc>();
  const snaps = await tx.getAll(...unicos.map((id) => refLutador(db, id)));
  const mapa = new Map<string, LutadorDoc>();
  for (const s of snaps) {
    const d = s.data();
    if (s.exists && d && d.ownerUid === uid) mapa.set(s.id, d);
  }
  return mapa;
}

type Plano = {
  doc: ChaveDoc;
  repescagem: { ref: DocumentReference<ChaveDoc>; doc: ChaveDoc } | null;
};

/** Se a 1ª rodada do absoluto acabou agora, monta a repescagem (sem gravar). */
function planejarRepescagem(
  db: Firestore,
  chaveId: string,
  doc: ChaveDoc,
  lutadores: Map<string, LutadorDoc>,
  uid: string,
  agora: string
): Plano {
  const principal = (doc.tipo ?? 'principal') === 'principal';
  if (!principal || doc.repescagemId || doc.semRepescagem || !doc.chave || !deveGerarRepescagem(doc.chave)) return { doc, repescagem: null };

  const perdedores = perdedoresDaPrimeiraRodada(doc.chave);
  const atrasados = (doc.filaRepescagem ?? []).filter((id) => !perdedores.includes(id));
  const ids = [...perdedores, ...atrasados].filter((id) => lutadores.has(id));
  if (ids.length < 2) return { doc, repescagem: null };

  const atletas = ids.map((id) => snapshotAtleta(id, lutadores.get(id)!, atrasados.includes(id)));
  const ref = db.collection(COLECAO_CHAVES).doc() as DocumentReference<ChaveDoc>;
  const repDoc: ChaveDoc = {
    ...novaChaveDoc(`${doc.nome} · Repescagem`, ids, uid, agora),
    tipo: 'repescagem',
    principalId: chaveId,
    atletas,
    chave: gerarChave(atletas, { aleatorio: Math.random }),
    sorteadaEm: agora,
    tatame: doc.tatame,
  };
  return { doc: { ...doc, repescagemId: ref.id, filaRepescagem: [] }, repescagem: { ref, doc: repDoc } };
}

/** Ids extras que precisam ser lidos se a repescagem for nascer agora. */
function idsParaRepescagem(doc: ChaveDoc): string[] {
  if ((doc.tipo ?? 'principal') !== 'principal' || doc.repescagemId || doc.semRepescagem || !doc.chave || !deveGerarRepescagem(doc.chave)) return [];
  return [...perdedoresDaPrimeiraRodada(doc.chave), ...(doc.filaRepescagem ?? [])];
}

export async function registrarResultadoCompleto(
  db: Firestore,
  uid: string,
  chaveId: string,
  lutaId: string,
  vencedorId: string,
  metodo: MetodoVitoria
): Promise<ChaveDoc> {
  const ref = refChave(db, chaveId);
  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    if (!atual.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
    const lutaAntes = buscarLuta(atual.chave, lutaId);
    const agora = new Date().toISOString();

    let proximo = finalizarLuta(atual, lutaId, vencedorId, metodo, agora);
    const luta = buscarLuta(proximo.chave!, lutaId);
    const perdedorId = luta.vencedor === luta.azul ? luta.branco! : luta.azul!;

    // Leituras (todas antes de qualquer gravação).
    const lutadores = await lerLutadores(tx, db, [vencedorId, perdedorId, ...idsParaRepescagem(proximo)], uid);
    const resultadoRef = db.collection(COLECAO_RESULTADOS).doc(idResultado(chaveId, lutaId, atual.fase));

    // Desempenho.
    const nivel = (id: string) => atual.atletas.find((a) => a.id === id)?.nivel ?? 0;
    const nome = (id: string) => atual.atletas.find((a) => a.id === id)?.nome ?? id;
    const condicao = condicaoDaLuta(atual, atual.chave, lutaAntes, metodo);
    const { duracaoSeg, duracaoTotalSeg } = duracaoDe(proximo, lutaId);
    const lv = lutadores.get(vencedorId);
    const lp = lutadores.get(perdedorId);
    const ajuste = calcularAjuste({
      vencedor: { nivel: nivel(vencedorId), desempenho: desempenhoDe(lv ?? {}) },
      perdedor: { nivel: nivel(perdedorId), desempenho: desempenhoDe(lp ?? {}) },
      metodo, duracaoSeg, duracaoTotalSeg, condicao,
    });
    if (lv) lutadores.set(vencedorId, { ...lv, desempenho: aplicarDelta(desempenhoDe(lv), ajuste.deltaVencedor, true, agora) });
    if (lp) lutadores.set(perdedorId, { ...lp, desempenho: aplicarDelta(desempenhoDe(lp), ajuste.deltaPerdedor, false, agora) });

    const plano = planejarRepescagem(db, chaveId, proximo, lutadores, uid, agora);
    proximo = { ...plano.doc, updatedAt: agora };

    // Gravações.
    tx.set(ref, proximo);
    if (lv) tx.set(refLutador(db, vencedorId), lutadores.get(vencedorId)!);
    if (lp) tx.set(refLutador(db, perdedorId), lutadores.get(perdedorId)!);
    const resultado: ResultadoDoc = {
      ownerUid: uid, chaveId, tipoChave: atual.tipo ?? 'principal', lutaId, data: agora,
      vencedorId, perdedorId, vencedorNome: nome(vencedorId), perdedorNome: nome(perdedorId),
      metodo, duracaoSeg, duracaoTotalSeg, condicao,
      nivelVencedor: nivel(vencedorId), nivelPerdedor: nivel(perdedorId),
      chanceVencedor: ajuste.chanceVencedor, deltaVencedor: ajuste.deltaVencedor, deltaPerdedor: ajuste.deltaPerdedor,
    };
    tx.set(resultadoRef, resultado);
    if (plano.repescagem) tx.set(plano.repescagem.ref, plano.repescagem.doc);
    return proximo;
  });
}

export async function desfazerResultadoCompleto(db: Firestore, uid: string, chaveId: string, lutaId: string): Promise<ChaveDoc> {
  const ref = refChave(db, chaveId);
  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    if (!atual.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
    const luta = buscarLuta(atual.chave, lutaId);
    if (atual.repescagemId && luta.rodada === 1) {
      throw new ErroHttp(409, 'A repescagem já foi sorteada com o resultado dessa luta');
    }

    const resultadoRef = db.collection(COLECAO_RESULTADOS).doc(idResultado(chaveId, lutaId, atual.fase));
    const resultadoSnap = await tx.get(resultadoRef);
    const resultado = resultadoSnap.data() as ResultadoDoc | undefined;
    const lutadores = resultado ? await lerLutadores(tx, db, [resultado.vencedorId, resultado.perdedorId], uid) : new Map();

    const agora = new Date().toISOString();
    const proximo: ChaveDoc = { ...desfazerLuta(atual, lutaId), updatedAt: agora };

    tx.set(ref, proximo);
    if (resultado) {
      const v = lutadores.get(resultado.vencedorId);
      const p = lutadores.get(resultado.perdedorId);
      const conta = resultado.condicao === 'wo' ? null : true;
      if (v) tx.set(refLutador(db, resultado.vencedorId), { ...v, desempenho: reverterDelta(desempenhoDe(v), resultado.deltaVencedor, conta && true, agora) });
      if (p) tx.set(refLutador(db, resultado.perdedorId), { ...p, desempenho: reverterDelta(desempenhoDe(p), resultado.deltaPerdedor, conta && false, agora) });
      tx.delete(resultadoRef);
    }
    return proximo;
  });
}

/** W.O.: o ausente perde sem luta; não mexe no desempenho. Pode fechar a 1ª rodada. */
export async function registrarWOCompleto(db: Firestore, uid: string, chaveId: string, lutaId: string, ausenteId: string) {
  const ref = refChave(db, chaveId);
  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    if (!atual.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
    const agora = new Date().toISOString();
    let proximo = limparCronometrosOrfaos({ ...atual, chave: registrarWO(atual.chave, lutaId, ausenteId) });

    const lutadores = await lerLutadores(tx, db, idsParaRepescagem(proximo), uid);
    const plano = planejarRepescagem(db, chaveId, proximo, lutadores, uid, agora);
    proximo = { ...plano.doc, updatedAt: agora };

    tx.set(ref, proximo);
    if (plano.repescagem) tx.set(plano.repescagem.ref, plano.repescagem.doc);
    return proximo;
  });
}

/**
 * Exclui uma chave em qualquer estado. No absoluto, a repescagem vai junto;
 * excluir só a repescagem avisa o absoluto para não sortear outra.
 * Com `desfazerLutas`, as lutas saem da tabela e o efeito delas no nível dos
 * lutadores é desfeito (útil para chave de teste); sem, o histórico fica.
 */
export async function excluirChaveCompleta(
  db: Firestore,
  uid: string,
  chaveId: string,
  desfazerLutas: boolean
): Promise<{ excluidas: string[]; lutasDesfeitas: number }> {
  const ref = refChave(db, chaveId);
  const inicial = await db.runTransaction((tx) => lerChaveDoUsuario(tx, ref, uid));
  const principal = (inicial.tipo ?? 'principal') === 'principal';
  const ids = [chaveId, ...(principal && inicial.repescagemId ? [inicial.repescagemId] : [])];

  // Resultados gravados por essas chaves (lidos antes da transação: são consultas).
  const resultados: { ref: DocumentReference; dados: ResultadoDoc }[] = [];
  if (desfazerLutas) {
    for (const id of ids) {
      const snap = await db.collection(COLECAO_RESULTADOS).where('chaveId', '==', id).get();
      for (const d of snap.docs) {
        const dados = d.data() as ResultadoDoc;
        if (dados.ownerUid === uid) resultados.push({ ref: db.collection(COLECAO_RESULTADOS).doc(d.id), dados });
      }
    }
  }

  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    const refPrincipal = !principal && atual.principalId ? refChave(db, atual.principalId) : null;
    const snapPrincipal = refPrincipal ? await tx.get(refPrincipal) : null;

    const envolvidos = [...new Set(resultados.flatMap((r) => [r.dados.vencedorId, r.dados.perdedorId]))];
    const lutadores = envolvidos.length ? await lerLutadores(tx, db, envolvidos, uid) : new Map<string, LutadorDoc>();
    const agora = new Date().toISOString();

    // Desfaz o efeito de cada luta no nível (soma dos deltas; a ordem não importa).
    for (const { dados } of resultados) {
      const conta = dados.condicao === 'wo' ? null : true;
      const v = lutadores.get(dados.vencedorId);
      const p = lutadores.get(dados.perdedorId);
      if (v) lutadores.set(dados.vencedorId, { ...v, desempenho: reverterDelta(desempenhoDe(v), dados.deltaVencedor, conta && true, agora) });
      if (p) lutadores.set(dados.perdedorId, { ...p, desempenho: reverterDelta(desempenhoDe(p), dados.deltaPerdedor, conta && false, agora) });
    }
    for (const [id, l] of lutadores) tx.set(refLutador(db, id), l);
    for (const r of resultados) tx.delete(r.ref);

    if (refPrincipal && snapPrincipal?.exists) {
      const p = snapPrincipal.data() as ChaveDoc;
      if (p.ownerUid === uid) tx.set(refPrincipal, { ...p, repescagemId: null, semRepescagem: true, updatedAt: agora });
    }
    for (const id of ids) tx.delete(refChave(db, id));
    return { excluidas: ids, lutasDesfeitas: resultados.length };
  });
}
