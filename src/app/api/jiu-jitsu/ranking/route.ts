/**
 * API Route - Ranking da temporada por faixa
 * GET /api/jiu-jitsu/ranking?ano=2026  (padrão: ano atual)
 *
 * Calculado na hora a partir das chaves do ano (absoluto + repescagem), com a
 * tabela de pontos em `pontos`. Os pontos ficam na faixa que o atleta tinha
 * em cada noite.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { COLECAO_CHAVES, type ChaveDoc } from '@/lib/jiu-jitsu/chaves';
import { ErroHttp, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { calcularRanking, PONTOS } from '@/lib/jiu-jitsu/ranking';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const anoParam = request.nextUrl.searchParams.get('ano');
    const ano = anoParam ? Number(anoParam) : new Date().getUTCFullYear();
    if (!Number.isInteger(ano) || ano < 2000 || ano > 2100) throw new ErroHttp(400, 'Ano inválido');

    const snapshot = await adminDb().collection(COLECAO_CHAVES).where('ownerUid', '==', auth.usuario.uid).get();
    const chaves = snapshot.docs.map((d) => ({ id: d.id, doc: d.data() as ChaveDoc }));
    return NextResponse.json({ ano, pontos: PONTOS, faixas: calcularRanking(chaves, ano) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao calcular o ranking');
  }
}
