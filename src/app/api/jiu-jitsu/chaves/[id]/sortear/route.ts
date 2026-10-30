/**
 * API Route - Sortear chave
 * POST /api/jiu-jitsu/chaves/:id/sortear
 *
 * Gera (ou refaz) as lutas a partir dos inscritos. Guarda uma foto dos dados
 * de cada atleta neste momento. Só é permitido antes da primeira luta começar.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { gerarChave } from '@/lib/jiu-jitsu/chave';
import { detalheChave, podeAlterarInscricoes, snapshotAtleta, type ChaveDoc } from '@/lib/jiu-jitsu/chaves';
import { ErroHttp, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { lerChaveDoUsuario, lerLutadoresDoUsuario, refChave } from '@/lib/jiu-jitsu/repositorio';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string } };

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const db = adminDb();
    const ref = refChave(db, params.id);

    const sorteado = await db.runTransaction(async (tx) => {
      const atual = await lerChaveDoUsuario(tx, ref, auth.usuario.uid);
      if (!podeAlterarInscricoes(atual)) {
        throw new ErroHttp(409, 'As lutas já começaram; não dá mais para sortear de novo');
      }
      if (atual.inscritos.length < 2) throw new ErroHttp(400, 'Inscreva pelo menos 2 atletas para sortear');

      const lutadores = await lerLutadoresDoUsuario(db, atual.inscritos, auth.usuario.uid, tx);
      const atletas = atual.inscritos.map((id) => snapshotAtleta(id, lutadores.get(id)!));
      const chave = gerarChave(atletas, { aleatorio: Math.random });

      const agora = new Date().toISOString();
      const proximo: ChaveDoc = { ...atual, atletas, chave, cronometros: {}, sorteadaEm: agora, updatedAt: agora };
      tx.set(ref, proximo);
      return proximo;
    });

    return NextResponse.json({ chave: detalheChave(params.id, sorteado) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao sortear chave');
  }
}
