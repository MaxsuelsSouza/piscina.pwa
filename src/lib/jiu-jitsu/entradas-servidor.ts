/**
 * Entrada de atrasados com acesso ao banco (somente servidor).
 */

import type { DocumentReference, Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';
import { buscarLuta, type Chave } from './chave';
import { snapshotAtleta, type AtletaSnapshot, type ChaveDoc } from './chaves';
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
import { lerChaveDoUsuario, refChave } from './repositorio';
import { limparCronometrosOrfaos } from './tatame';

export const EntradaSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('vaga'), lutadorId: z.string().min(1), lutaId: z.string().min(1) }),
  z.object({ tipo: z.literal('desafio'), lutadorId: z.string().min(1), lutaId: z.string().min(1), cor: z.enum(['azul', 'branco']) }),
  z.object({ tipo: z.literal('substituir'), lutadorId: z.string().min(1), ausente: z.string().min(1) }),
  z.object({ tipo: z.literal('repescagem'), lutadorId: z.string().min(1) }),
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
};

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
  };
}

export async function registrarEntrada(db: Firestore, uid: string, chaveId: string, entrada: Entrada): Promise<ChaveDoc> {
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
