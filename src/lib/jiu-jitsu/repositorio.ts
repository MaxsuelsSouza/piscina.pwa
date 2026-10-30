/**
 * Acesso ao Firestore do módulo de lutas (somente servidor).
 * Toda leitura confere o dono do documento: o de outro usuário vira 404.
 */

import type { DocumentReference, Firestore, Transaction } from 'firebase-admin/firestore';
import { COLECAO_CHAVES, type ChaveDoc } from './chaves';
import { ErroHttp } from './http';
import { COLECAO_LUTADORES, type LutadorDoc } from './lutadores';

export function refChave(db: Firestore, id: string) {
  return db.collection(COLECAO_CHAVES).doc(id) as DocumentReference<ChaveDoc>;
}

export async function lerChaveDoUsuario(
  tx: Transaction,
  ref: DocumentReference<ChaveDoc>,
  uid: string
): Promise<ChaveDoc> {
  const snap = await tx.get(ref);
  const doc = snap.data();
  if (!snap.exists || !doc || doc.ownerUid !== uid) throw new ErroHttp(404, 'Chave não encontrada');
  return doc;
}

/** Carrega lutadores pelos IDs, garantindo que todos existem e são do usuário. */
export async function lerLutadoresDoUsuario(
  db: Firestore,
  ids: string[],
  uid: string,
  tx?: Transaction
): Promise<Map<string, LutadorDoc>> {
  if (ids.length === 0) return new Map();
  const refs = ids.map((id) => db.collection(COLECAO_LUTADORES).doc(id));
  const snaps = tx ? await tx.getAll(...refs) : await db.getAll(...refs);

  const mapa = new Map<string, LutadorDoc>();
  for (const snap of snaps) {
    const doc = snap.data() as LutadorDoc | undefined;
    if (!snap.exists || !doc || doc.ownerUid !== uid) {
      throw new ErroHttp(400, 'Um dos lutadores inscritos não existe');
    }
    mapa.set(snap.id, doc);
  }
  return mapa;
}
