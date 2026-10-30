/**
 * API Route - Resposta ao desafio de entrada
 * POST /api/jiu-jitsu/chaves/:id/lutas/:lutaId/desafio  { aceitar }
 *
 * Aceito: vira luta (o atrasado começa em desvantagem) e o lugar fica em
 * disputa. Recusado: o atrasado vai para a fila da repescagem; se ela já foi
 * sorteada, a resposta traz `repescagemId` para fazer a entrada lá.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { detalheChave } from '@/lib/jiu-jitsu/chaves';
import { RespostaDesafioSchema, responderDesafioCompleto } from '@/lib/jiu-jitsu/entradas-servidor';
import { lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string; lutaId: string } };

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const { aceitar } = await lerCorpo(request, RespostaDesafioSchema);
    const r = await responderDesafioCompleto(adminDb(), auth.usuario.uid, params.id, params.lutaId, aceitar);
    return NextResponse.json({
      chave: detalheChave(params.id, r.doc),
      atrasado: r.atrasado,
      foiParaFilaRepescagem: r.foiParaFilaRepescagem,
      repescagemId: aceitar ? null : r.repescagemId,
    });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao responder desafio');
  }
}
