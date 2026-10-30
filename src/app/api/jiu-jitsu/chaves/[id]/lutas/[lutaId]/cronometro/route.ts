/**
 * API Route - Pausar / retomar o cronômetro de uma luta
 * POST /api/jiu-jitsu/chaves/:id/lutas/:lutaId/cronometro  { acao: 'pausar' | 'retomar' }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { operarNaChave } from '@/lib/jiu-jitsu/operacao-chave';
import { CronometroSchema, estadoTatame, pausarLuta, retomarLuta } from '@/lib/jiu-jitsu/tatame';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string; lutaId: string } };

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const { acao } = await lerCorpo(request, CronometroSchema);
    const operar = acao === 'pausar' ? pausarLuta : retomarLuta;
    const { doc, agora } = await operarNaChave(adminDb(), params.id, auth.usuario.uid, (atual, agora) =>
      operar(atual, params.lutaId, agora)
    );
    return NextResponse.json({ tatame: estadoTatame(doc, agora) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao atualizar cronômetro');
  }
}
