/**
 * API Route - Chave específica
 * GET    /api/jiu-jitsu/chaves/:id - chave completa para as telas 3, 4 e 5
 * PATCH  /api/jiu-jitsu/chaves/:id - renomeia, altera inscritos (só antes da 1ª luta;
 *                                    desfaz o sorteio) e/ou configura o tatame
 *                                    { tatame: { areas, duracaoSeg } }
 * DELETE /api/jiu-jitsu/chaves/:id[?desfazer=1] - exclui em qualquer estado (o absoluto leva a repescagem junto)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import { ChavePatchSchema, detalheChave, podeAlterarInscricoes, type ChaveDoc } from '@/lib/jiu-jitsu/chaves';
import { ErroHttp, lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { lerChaveDoUsuario, lerLutadoresDoUsuario, refChave } from '@/lib/jiu-jitsu/repositorio';
import { excluirChaveCompleta } from '@/lib/jiu-jitsu/resultados';

export const dynamic = 'force-dynamic';

type Contexto = { params: { id: string } };

export async function GET(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const db = adminDb();
    const doc = await db.runTransaction((tx) => lerChaveDoUsuario(tx, refChave(db, params.id), auth.usuario.uid));
    return NextResponse.json({ chave: detalheChave(params.id, doc) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao buscar chave');
  }
}

export async function PATCH(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const mudancas = await lerCorpo(request, ChavePatchSchema);
    const db = adminDb();
    const ref = refChave(db, params.id);

    const atualizado = await db.runTransaction(async (tx) => {
      const atual = await lerChaveDoUsuario(tx, ref, auth.usuario.uid);
      const proximo: ChaveDoc = { ...atual, updatedAt: new Date().toISOString() };
      if (mudancas.nome !== undefined) proximo.nome = mudancas.nome;

      if (mudancas.inscritos !== undefined) {
        if (!podeAlterarInscricoes(atual)) {
          throw new ErroHttp(409, 'As lutas já começaram; não dá mais para mudar os inscritos');
        }
        await lerLutadoresDoUsuario(db, mudancas.inscritos, auth.usuario.uid, tx);
        // Mudou quem luta: o sorteio anterior deixa de valer.
        Object.assign(proximo, { inscritos: mudancas.inscritos, atletas: [], chave: null, sorteadaEm: null, cronometros: {} });
      }

      if (mudancas.tatame !== undefined) {
        const ocupadaForaDoLimite = Object.entries(atual.cronometros ?? {}).some(
          ([lutaId, c]) => !c.finalizadoEm && c.area > mudancas.tatame!.areas && lutaAtiva(atual, lutaId)
        );
        if (ocupadaForaDoLimite) {
          throw new ErroHttp(409, 'Há luta em uma área que deixaria de existir; termine-a antes de reduzir as áreas');
        }
        // Vale para as próximas lutas chamadas; as que já estão na área mantêm a duração.
        proximo.tatame = mudancas.tatame;
      }

      tx.set(ref, proximo);
      return proximo;
    });

    return NextResponse.json({ chave: detalheChave(params.id, atualizado) });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao atualizar chave');
  }
}

function lutaAtiva(doc: ChaveDoc, lutaId: string) {
  const status = doc.chave?.lutas.find((l) => l.id === lutaId)?.status;
  return status === 'pronta' || status === 'em_andamento';
}

export async function DELETE(request: NextRequest, { params }: Contexto) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    // ?desfazer=1: também apaga as lutas da tabela e desfaz o efeito no nível dos lutadores.
    const desfazer = request.nextUrl.searchParams.get('desfazer') === '1';
    const r = await excluirChaveCompleta(adminDb(), auth.usuario.uid, params.id, desfazer);
    return NextResponse.json(r);
  } catch (error) {
    return respostaDeErro(error, 'Erro ao excluir chave');
  }
}

