/**
 * Executa uma operação sobre a chave dentro de uma transação:
 * lê a chave do usuário, aplica a função e grava o resultado.
 * Somente servidor.
 */

import type { Firestore } from 'firebase-admin/firestore';
import type { ChaveDoc } from './chaves';
import { ErroHttp } from './http';
import { lerChaveDoUsuario, refChave } from './repositorio';

/**
 * @param operacao recebe o documento atual e o horário do servidor
 *                 (o mesmo usado nos cronômetros) e devolve o novo documento.
 */
export async function operarNaChave(
  db: Firestore,
  chaveId: string,
  uid: string,
  operacao: (doc: ChaveDoc, agora: string) => ChaveDoc
): Promise<{ doc: ChaveDoc; agora: string }> {
  const ref = refChave(db, chaveId);
  return db.runTransaction(async (tx) => {
    const atual = await lerChaveDoUsuario(tx, ref, uid);
    if (!atual.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');

    const agora = new Date().toISOString();
    const proximo: ChaveDoc = { ...operacao(atual, agora), updatedAt: agora };
    tx.set(ref, proximo);
    return { doc: proximo, agora };
  });
}
