/**
 * API Route - Chamar luta para uma área do tatame
 * POST /api/jiu-jitsu/chaves/:id/lutas/:lutaId/chamar  { area }
 *
 * A luta ocupa a área e fica esperando o play ("Começar luta").
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { operarNaChave } from '@/lib/jiu-jitsu/operacao-chave';
import { chamarParaArea, ChamarSchema, estadoTatame } from '@/lib/jiu-jitsu/tatame';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string; lutaId: string } };

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const { area } = await lerCorpo(request, ChamarSchema);
    const { doc, agora } = await operarNaChave(adminDb(), params.id, auth.usuario.uid, (atual) =>
      chamarParaArea(atual, params.lutaId, area)
    );
    return NextResponse.json({ tatame: estadoTatame(doc, agora) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao chamar luta');
  }
}
