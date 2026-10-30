/**
 * API Route - Entrada de quem chegou depois do sorteio ("Chegou alguém")
 * GET  /api/jiu-jitsu/chaves/:id/entradas?lutador=ID
 *      opções para esse lutador: vagas de quem passou direto (com diferença
 *      de nível e se é permitida), desafios possíveis, quem pode ser
 *      substituído e a recomendação
 * POST /api/jiu-jitsu/chaves/:id/entradas
 *      { tipo: 'vaga', lutadorId, lutaId }
 *      { tipo: 'desafio', lutadorId, lutaId, cor }   → fica esperando o desafiado responder
 *      { tipo: 'substituir', lutadorId, ausente }
 *      { tipo: 'repescagem', lutadorId }             → entra na fila da repescagem
 *
 * Quem entra atrasado não recebe compensação.
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { detalheChave } from '@/lib/jiu-jitsu/chaves';
import { consultarOpcoes, EntradaSchema, registrarEntrada } from '@/lib/jiu-jitsu/entradas-servidor';
import { ErroHttp, lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const lutadorId = request.nextUrl.searchParams.get('lutador');
    if (!lutadorId) throw new ErroHttp(400, 'Informe o lutador (?lutador=ID)');
    const opcoes = await consultarOpcoes(adminDb(), auth.usuario.uid, params.id, lutadorId);
    return NextResponse.json({ opcoes });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao buscar opções de entrada');
  }
}

export async function POST(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const entrada = await lerCorpo(request, EntradaSchema);
    const doc = await registrarEntrada(adminDb(), auth.usuario.uid, params.id, entrada);
    return NextResponse.json({ chave: detalheChave(params.id, doc) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao registrar entrada');
  }
}
