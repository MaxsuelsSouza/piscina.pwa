/**
 * API Route - Lutador específico
 * GET   /api/jiu-jitsu/lutadores/:id - dados do lutador (com nível e histórico)
 * PATCH /api/jiu-jitsu/lutadores/:id - atualiza dados; mudanças de faixa, graus
 *                                      e peso entram no histórico
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { ErroHttp, lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import {
  aplicarAtualizacao,
  COLECAO_LUTADORES,
  paraLutador,
  type LutadorDoc,
} from '@/lib/jiu-jitsu/lutadores';
import { LutadorPatchSchema, LutadorSchema, primeiraMensagemErro } from '@/lib/jiu-jitsu/schemas';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const snap = await adminDb().collection(COLECAO_LUTADORES).doc(params.id).get();
    const doc = snap.data() as LutadorDoc | undefined;
    // Lutador de outro usuário responde 404 para não revelar que existe.
    if (!snap.exists || !doc || doc.ownerUid !== auth.usuario.uid) {
      throw new ErroHttp(404, 'Lutador não encontrado');
    }
    return NextResponse.json({ lutador: paraLutador(snap.id, doc) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao buscar lutador');
  }
}

export async function PATCH(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const mudancas = await lerCorpo(request, LutadorPatchSchema);
    const db = adminDb();
    const ref = db.collection(COLECAO_LUTADORES).doc(params.id);

    // Transação: duas edições ao mesmo tempo não perdem entradas do histórico.
    const atualizado = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const atual = snap.data() as LutadorDoc | undefined;
      if (!snap.exists || !atual || atual.ownerUid !== auth.usuario.uid) {
        throw new ErroHttp(404, 'Lutador não encontrado');
      }

      const proximo = aplicarAtualizacao(atual, mudancas, new Date().toISOString());

      // Revalida o resultado completo (ex.: graus compatíveis com a faixa nova).
      const valido = LutadorSchema.safeParse(proximo);
      if (!valido.success) throw new ErroHttp(400, primeiraMensagemErro(valido.error));

      tx.set(ref, proximo);
      return proximo;
    });

    return NextResponse.json({ lutador: paraLutador(params.id, atualizado) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao atualizar lutador');
  }
}
