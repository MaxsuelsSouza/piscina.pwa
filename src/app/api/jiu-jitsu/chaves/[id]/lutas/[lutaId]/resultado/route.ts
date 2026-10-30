/**
 * API Route - Resultado de uma luta
 * POST   /api/jiu-jitsu/chaves/:id/lutas/:lutaId/resultado  { vencedor, metodo }
 *        registra o vencedor, leva para a próxima luta, para o cronômetro,
 *        libera a área, grava na tabela de resultados, atualiza o desempenho
 *        dos dois lutadores e sorteia a repescagem se a 1ª rodada acabou
 * DELETE /api/jiu-jitsu/chaves/:id/lutas/:lutaId/resultado
 *        desfaz tudo isso (só se a luta seguinte ainda não começou)
 *
 * Erros de regra (luta não pronta, vencedor fora da luta...) respondem 409.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { detalheChave, ResultadoSchema } from '@/lib/jiu-jitsu/chaves';
import { lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { desfazerResultadoCompleto, registrarResultadoCompleto } from '@/lib/jiu-jitsu/resultados';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string; lutaId: string } };

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const { vencedor, metodo } = await lerCorpo(request, ResultadoSchema);
    const doc = await registrarResultadoCompleto(adminDb(), auth.usuario.uid, params.id, params.lutaId, vencedor, metodo);
    return NextResponse.json({ chave: detalheChave(params.id, doc) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao registrar resultado');
  }
}

export async function DELETE(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const doc = await desfazerResultadoCompleto(adminDb(), auth.usuario.uid, params.id, params.lutaId);
    return NextResponse.json({ chave: detalheChave(params.id, doc) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao desfazer resultado');
  }
}
