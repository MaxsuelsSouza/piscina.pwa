/**
 * Entrada de atrasados com acesso ao banco (somente servidor).
 */

import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { buscarLuta, type Chave } from './chave';
import { podeAlterarInscricoes, snapshotAtleta, sortearDoc, type AtletaSnapshot, type ChaveDoc } from './chaves';
import {
  ocuparVaga,
  opcoesDeEntrada,
  proporDesafio,
  responderDesafio,
  substituir,
  type OpcoesEntrada,
} from './entradas';
import { ErroHttp } from './http';
import { COLECAO_LUTADORES, type LutadorDoc } from './lutadores';
import { MAX_ATLETAS_CHAVE } from './schemas';
import { lerChaveDoUsuario, lerLutadoresDoUsuario, refChave } from './repositorio';
import { limparCronometrosOrfaos } from './tatame';

export const EntradaSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('vaga'), lutadorId: z.string().min(1), lutaId: z.string().min(1) }),
  z.object({ tipo: z.literal('desafio'), lutadorId: z.string().min(1), lutaId: z.string().min(1), cor: z.enum(['azul', 'branco']) }),
  z.object({ tipo: z.literal('substituir'), lutadorId: z.string().min(1), ausente: z.string().min(1) }),
  z.object({ tipo: z.literal('repescagem'), lutadorId: z.string().min(1) }),
  // Nenhuma luta começou: entra(m) na chave como inscrito(s) normal(is) e sorteia de novo.
  z.object({ tipo: z.literal('incluir'), lutadorIds: z.array(z.string().min(1)).min(1).max(MAX_ATLETAS_CHAVE) }),
]);
export type Entrada = z.infer<typeof EntradaSchema>;

export const RespostaDesafioSchema = z.object({ aceitar: z.boolean() });

function refLutador(db: Firestore, id: string) {
  return db.collection(COLECAO_LUTADORES).doc(id) as DocumentReference<LutadorDoc>;
}

function exigirLutador(snap: { exists: boolean; data(): LutadorDoc | undefined }, uid: string): LutadorDoc {
  const d = snap.data();
  if (!snap.exists || !d || d.ownerUid !== uid) throw new ErroHttp(404, 'Lutador não encontrado');
  return d;
}

const atuaNaChave = (chave: Chave, id: string) =>
  chave.lutas.some((l) => (l.azul === id || l.branco === id) && l.status !== 'recusada');

export type OpcoesComNomes = OpcoesEntrada & {
  atleta: AtletaSnapshot;
  nomes: Record<string, string>;
  repescagem: { id: string | null; aceitaFila: boolean };
  /**
   * Nenhuma luta começou ainda: dá para incluir na chave e sortear de novo,
   * com compensação normal. `lugares` = quantos ainda cabem (máx. 30).
   */
  incluir: { possivel: boolean; lugares: number };
};

/** Só a chave principal, antes da primeira luta começar. */
function aceitaIncluir(doc: ChaveDoc) {
  return (doc.tipo ?? 'principal') === 'principal' && podeAlterarInscricoes(doc);
}

export async function consultarOpcoes(db: Firestore, uid: string, chaveId: string, lutadorId: string): Promise<OpcoesComNomes> {
  const [doc, lutador] = await db.runTransaction(async (tx) => {
    const d = await lerChaveDoUsuario(tx, refChave(db, chaveId), uid);
    const l = exigirLutador(await tx.get(refLutador(db, lutadorId)), uid);
    return [d, l] as const;
  });
  if (!doc.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
  if (atuaNaChave(doc.chave, lutadorId)) throw new ErroHttp(409, 'Esse lutador já está na chave');

  const atleta = snapshotAtleta(lutadorId, lutador, true);
  const nomes = Object.fromEntries(doc.atletas.map((a) => [a.id, a.nome]));
  const principal = (doc.tipo ?? 'principal') === 'principal';
  return {
    ...opcoesDeEntrada(doc.chave, atleta),
    atleta,
    nomes,
    repescagem: { id: doc.repescagemId ?? null, aceitaFila: principal && !doc.repescagemId },
    incluir: { possivel: aceitaIncluir(doc), lugares: Math.max(0, MAX_ATLETAS_CHAVE - doc.inscritos.length) },
  };
}

/** Inclui um ou mais lutadores como inscritos normais e refaz o sorteio. */
async function incluirESortear(db: Firestore, uid: string, chaveId: string, lutadorIds: string[]): Promise<ChaveDoc> {
  const ref = refChave(db, chaveId);
  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    if (!atual.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
    if (!aceitaIncluir(atual)) {
      throw new ErroHttp(409, 'As lutas já começaram; agora só dá para entrar por vaga, desafio, substituição ou repescagem');
    }
    const novos = Array.from(new Set(lutadorIds)).filter((id) => !atual.inscritos.includes(id));
    if (novos.length === 0) throw new ErroHttp(409, 'Essas pessoas já estão na chave');
    const inscritos = [...atual.inscritos, ...novos];
    if (inscritos.length > MAX_ATLETAS_CHAVE) {
      throw new ErroHttp(400, `A chave aceita no máximo ${MAX_ATLETAS_CHAVE} atletas`);
    }
    const lutadores = await lerLutadoresDoUsuario(db, inscritos, uid, tx);
    const fila = (atual.filaRepescagem ?? []).filter((id) => !novos.includes(id));
    const proximo = sortearDoc({ ...atual, inscritos, filaRepescagem: fila }, lutadores, new Date().toISOString());
    tx.set(ref, proximo);
    return proximo;
  });
}

export async function registrarEntrada(db: Firestore, uid: string, chaveId: string, entrada: Entrada): Promise<ChaveDoc> {
  if (entrada.tipo === 'incluir') return incluirESortear(db, uid, chaveId, entrada.lutadorIds);
  const ref = refChave(db, chaveId);
  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    const lutador = exigirLutador(await tx.get(refLutador(db, entrada.lutadorId)), uid);
    if (!atual.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
    if (atuaNaChave(atual.chave, entrada.lutadorId)) throw new ErroHttp(409, 'Esse lutador já está na chave');

    const atleta = snapshotAtleta(entrada.lutadorId, lutador, true);
    let proximo: ChaveDoc;

    if (entrada.tipo === 'repescagem') {
      if ((atual.tipo ?? 'principal') === 'repescagem') throw new ErroHttp(409, 'Essa já é a chave da repescagem');
      if (atual.repescagemId) {
        throw new ErroHttp(409, `A repescagem já foi sorteada; faça a entrada nela (${atual.repescagemId})`);
      }
      const fila = atual.filaRepescagem ?? [];
      proximo = { ...atual, filaRepescagem: fila.includes(atleta.id) ? fila : [...fila, atleta.id] };
    } else {
      const chave =
        entrada.tipo === 'vaga'
          ? ocuparVaga(atual.chave, atleta, entrada.lutaId)
          : entrada.tipo === 'desafio'
            ? proporDesafio(atual.chave, atleta, entrada.lutaId, entrada.cor)
            : substituir(atual.chave, atleta, entrada.ausente);
      proximo = limparCronometrosOrfaos({
        ...atual,
        chave,
        atletas: [...atual.atletas.filter((a) => a.id !== atleta.id), atleta],
        inscritos: atual.inscritos.includes(atleta.id) ? atual.inscritos : [...atual.inscritos, atleta.id],
      });
    }

    proximo = { ...proximo, updatedAt: new Date().toISOString() };
    tx.set(ref, proximo);
    return proximo;
  });
}

export type RespostaDesafio = { doc: ChaveDoc; atrasado: string; foiParaFilaRepescagem: boolean; repescagemId: string | null };

export async function responderDesafioCompleto(
  db: Firestore,
  uid: string,
  chaveId: string,
  desafioId: string,
  aceitar: boolean
): Promise<RespostaDesafio> {
  const ref = refChave(db, chaveId);
  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    if (!atual.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
    const desafio = buscarLuta(atual.chave, desafioId);
    const atrasado = desafio.branco!;

    let proximo: ChaveDoc = limparCronometrosOrfaos({ ...atual, chave: responderDesafio(atual.chave, desafioId, aceitar) });
    // Recusado: o atrasado vai para a fila da repescagem, se ela ainda não foi sorteada.
    const principal = (atual.tipo ?? 'principal') === 'principal';
    const foiParaFilaRepescagem = !aceitar && principal && !atual.repescagemId;
    if (foiParaFilaRepescagem) {
      const fila = proximo.filaRepescagem ?? [];
      proximo = { ...proximo, filaRepescagem: fila.includes(atrasado) ? fila : [...fila, atrasado] };
    }
    proximo = { ...proximo, updatedAt: new Date().toISOString() };
    tx.set(ref, proximo);
    return { doc: proximo, atrasado, foiParaFilaRepescagem, repescagemId: atual.repescagemId ?? null };
  });
}
