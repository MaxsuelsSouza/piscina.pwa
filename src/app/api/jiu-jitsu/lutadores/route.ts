/**
 * API Route - Lutadores (alunos salvos para as chaves)
 * GET  /api/jiu-jitsu/lutadores?q=nome - lista/busca os lutadores do usuário
 * POST /api/jiu-jitsu/lutadores        - cadastra um lutador
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { exigirUsuario } from '@/lib/jiu-jitsu/auth';
import {
  COLECAO_LUTADORES,
  filtrarPorNome,
  novoLutadorDoc,
  paraLutador,
  type LutadorDoc,
} from '@/lib/jiu-jitsu/lutadores';
import { LutadorSchema, primeiraMensagemErro } from '@/lib/jiu-jitsu/schemas';

export const dynamic = 'force-dynamic';

const LIMITE_RESULTADOS = 50;

export async function GET(request: NextRequest) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  try {
    const busca = request.nextUrl.searchParams.get('q') ?? '';
    const snapshot = await adminDb()
      .collection(COLECAO_LUTADORES)
      .where('ownerUid', '==', auth.usuario.uid)
      .get();

    // Busca por trecho do nome é feita em memória: o Firestore não tem "contains",
    // e uma academia tem poucas centenas de alunos no máximo.
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as LutadorDoc) }));
    const lutadores = filtrarPorNome(docs, busca)
      .slice(0, LIMITE_RESULTADOS)
      .map(({ id, ...doc }) => paraLutador(id, doc));

    return NextResponse.json({ lutadores });
  } catch (error) {
    console.error('Erro ao buscar lutadores:', error);
    return NextResponse.json({ error: 'Erro ao buscar lutadores' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await exigirUsuario(request);
  if (!auth.ok) return auth.resposta;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  const parsed = LutadorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: primeiraMensagemErro(parsed.error) }, { status: 400 });
  }

  try {
    const agora = new Date().toISOString();
    const doc = novoLutadorDoc(parsed.data, auth.usuario.uid, agora);
    const ref = await adminDb().collection(COLECAO_LUTADORES).add(doc);
    return NextResponse.json({ lutador: paraLutador(ref.id, doc) }, { status: 201 });
  } catch (error) {
    console.error('Erro ao cadastrar lutador:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar lutador' }, { status: 500 });
  }
}
