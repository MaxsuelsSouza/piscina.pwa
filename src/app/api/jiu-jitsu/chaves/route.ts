/**
 * API Route - Chaves de lutas
 * GET  /api/jiu-jitsu/chaves - resumo das chaves do usuário (tela 1)
 * POST /api/jiu-jitsu/chaves - cria uma chave em rascunho { nome, inscritos? }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import {
  ChaveCriarSchema,
  COLECAO_CHAVES,
  detalheChave,
  novaChaveDoc,
  resumoChave,
  type ChaveDoc,
} from '@/lib/jiu-jitsu/chaves';
import { lerCorpo, respostaDeErro } from '@/lib/jiu-jitsu/http';
import { lerLutadoresDoUsuario } from '@/lib/jiu-jitsu/repositorio';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const snapshot = await adminDb().collection(COLECAO_CHAVES).where('ownerUid', '==', auth.usuario.uid).get();
    // Ordena em memória para não exigir índice composto no Firestore.
    const chaves = snapshot.docs
      .map((d) => resumoChave(d.id, d.data() as ChaveDoc))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ chaves });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao buscar chaves');
  }
}

export async function POST(request: NextRequest) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const dados = await lerCorpo(request, ChaveCriarSchema);
    const db = adminDb();
    await lerLutadoresDoUsuario(db, dados.inscritos, auth.usuario.uid);

    const doc = novaChaveDoc(dados.nome, dados.inscritos, auth.usuario.uid, new Date().toISOString());
    const ref = await db.collection(COLECAO_CHAVES).add(doc);
    return NextResponse.json({ chave: detalheChave(ref.id, doc) }, { status: 201 });
  } catch (error) {
    return respostaDeErro(error, 'Erro ao criar chave');
  }
}
