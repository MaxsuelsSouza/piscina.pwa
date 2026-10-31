/**
 * API Route - Reorganizar a chave no meio da noite
 * POST /api/jiu-jitsu/chaves/:id/reorganizar
 *      { manter: [ids na disputa que continuam], novos: [ids de lutadores que entram] }
 *
 * As lutas já terminadas ficam no histórico (fasesAnteriores) e uma chave nova
 * é sorteada entre quem continua. Bloqueado com luta rolando no tatame.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { detalheChave, snapshotAtleta } from '@/lib/jiu-jitsu/chaves';
import { lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { reorganizarDoc } from '@/lib/jiu-jitsu/reorganizar';
import { lerChaveDoUsuario, lerLutadoresDoUsuario, refChave } from '@/lib/jiu-jitsu/repositorio';
import { MAX_ATLETAS_CHAVE } from '@/lib/jiu-jitsu/schemas';

export const dynamic = 'force-dynamic';

const Schema = z.object({
  manter: z.array(z.string().min(1)).max(MAX_ATLETAS_CHAVE),
  novos: z.array(z.string().min(1)).max(MAX_ATLETAS_CHAVE),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const { manter, novos } = await lerCorpo(request, Schema);
    const db = adminDb();
    const ref = refChave(db, params.id);

    const doc = await db.runTransaction(async (tx) => {
      const atual = await lerChaveDoUsuario(tx, ref, auth.usuario.uid);
      const lutadores = await lerLutadoresDoUsuario(db, novos, auth.usuario.uid, tx);
      const proximo = reorganizarDoc(atual, {
        manter,
        novos: novos.map((id) => snapshotAtleta(id, lutadores.get(id)!)),
        agora: new Date().toISOString(),
      });
      tx.set(ref, proximo);
      return proximo;
    });

    return NextResponse.json({ chave: detalheChave(params.id, doc) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao reorganizar a chave');
  }
}
