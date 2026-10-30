/**
 * API Route - Estado do tatame (tela 4b)
 * GET /api/jiu-jitsu/chaves/:id/tatame
 *
 * Devolve cada área (livre, aguardando, rodando, pausada, tempo esgotado),
 * o tempo restante calculado agora, a fila e o horário do servidor (`agora`),
 * que o celular usa para corrigir o próprio relógio ao animar o cronômetro.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { ErroHttp, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { lerChaveDoUsuario, refChave } from '@/lib/jiu-jitsu/repositorio';
import { estadoTatame } from '@/lib/jiu-jitsu/tatame';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const db = adminDb();
    const doc = await db.runTransaction((tx) => lerChaveDoUsuario(tx, refChave(db, params.id), auth.usuario.uid));
    if (!doc.chave) throw new ErroHttp(409, 'A chave ainda não foi sorteada');
    return NextResponse.json({ tatame: estadoTatame(doc, new Date().toISOString()) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao buscar o tatame');
  }
}
