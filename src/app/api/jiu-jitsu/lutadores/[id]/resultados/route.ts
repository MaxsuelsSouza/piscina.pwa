/**
 * API Route - Histórico de lutas de um lutador
 * GET /api/jiu-jitsu/lutadores/:id/resultados
 *
 * Lista quem ele venceu e para quem perdeu, com método, tempo até o
 * resultado, condição da luta e quanto o ajuste de desempenho mudou.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { ErroHttp, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { COLECAO_LUTADORES, type LutadorDoc } from '@/lib/jiu-jitsu/lutadores';
import { COLECAO_RESULTADOS, type ResultadoDoc } from '@/lib/jiu-jitsu/resultados';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const db = adminDb();
    const lutador = (await db.collection(COLECAO_LUTADORES).doc(params.id).get()).data() as LutadorDoc | undefined;
    if (!lutador || lutador.ownerUid !== auth.usuario.uid) throw new ErroHttp(404, 'Lutador não encontrado');

    // Duas consultas de igualdade simples (sem índice composto).
    const col = db.collection(COLECAO_RESULTADOS);
    const [venceu, perdeu] = await Promise.all([
      col.where('vencedorId', '==', params.id).get(),
      col.where('perdedorId', '==', params.id).get(),
    ]);

    const lutas = [
      ...venceu.docs.map((d) => ({ r: d.data() as ResultadoDoc, venceu: true })),
      ...perdeu.docs.map((d) => ({ r: d.data() as ResultadoDoc, venceu: false })),
    ]
      .filter(({ r }) => r.ownerUid === auth.usuario.uid)
      .sort((a, b) => b.r.data.localeCompare(a.r.data))
      .map(({ r, venceu: v }) => ({
        data: r.data,
        chaveId: r.chaveId,
        tipoChave: r.tipoChave,
        resultado: v ? 'vitoria' : 'derrota',
        adversarioId: v ? r.perdedorId : r.vencedorId,
        adversario: v ? r.perdedorNome : r.vencedorNome,
        metodo: r.metodo,
        duracaoSeg: r.duracaoSeg,
        condicao: r.condicao,
        nivelProprio: v ? r.nivelVencedor : r.nivelPerdedor,
        nivelAdversario: v ? r.nivelPerdedor : r.nivelVencedor,
        chanceDeVencer: v ? r.chanceVencedor : Math.round((1 - r.chanceVencedor) * 1000) / 1000,
        deltaAjuste: v ? r.deltaVencedor : r.deltaPerdedor,
      }));

    return NextResponse.json({ lutas });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao buscar resultados');
  }
}
