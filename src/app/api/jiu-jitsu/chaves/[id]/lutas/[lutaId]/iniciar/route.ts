/**
 * API Route - Iniciar luta ("Começar luta" / play)
 * POST /api/jiu-jitsu/chaves/:id/lutas/:lutaId/iniciar
 *
 * Marca a luta como em andamento e dispara o cronômetro (horário salvo no
 * servidor). A partir daqui a chave não aceita novo sorteio nem mudança de
 * inscritos.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { respostaDeErro } from '@/lib/jiu-jitsu/http';
import { operarNaChave } from '@/lib/jiu-jitsu/operacao-chave';
import { comecarLuta, estadoTatame } from '@/lib/jiu-jitsu/tatame';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string; lutaId: string } };

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const { doc, agora } = await operarNaChave(adminDb(), params.id, auth.usuario.uid, (atual, agora) =>
      comecarLuta(atual, params.lutaId, agora)
    );
    return NextResponse.json({ tatame: estadoTatame(doc, agora) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao iniciar luta');
  }
}
