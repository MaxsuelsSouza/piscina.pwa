/**
 * API Route - W.O.
 * POST /api/jiu-jitsu/chaves/:id/lutas/:lutaId/wo  { ausente }
 *
 * O atleta ausente perde sem luta e é marcado como desistente. Não conta para
 * o desempenho nem para o ranking. Para pôr alguém no lugar, use a entrada
 * "substituir" em vez do W.O.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { detalheChave } from '@/lib/jiu-jitsu/chaves';
import { lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { registrarWOCompleto } from '@/lib/jiu-jitsu/resultados';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string; lutaId: string } };

const WOSchema = z.object({ ausente: z.string().min(1, 'Informe quem faltou') });

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const { ausente } = await lerCorpo(request, WOSchema);
    const doc = await registrarWOCompleto(adminDb(), auth.usuario.uid, params.id, params.lutaId, ausente);
    return NextResponse.json({ chave: detalheChave(params.id, doc) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao registrar W.O.');
  }
}
