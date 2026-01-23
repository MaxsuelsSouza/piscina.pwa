/**
 * API Route para anotacoes de quiz
 * GET /api/quiz/anotacoes?quizId=xxx&questaoId=yyy - Lista anotacoes
 * POST /api/quiz/anotacoes - Cria ou atualiza anotacao
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'quiz_anotacoes';

// GET - Listar anotacoes de uma questao
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get('quizId');
    const questaoId = searchParams.get('questaoId');

    if (!quizId || !questaoId) {
      return NextResponse.json(
        { error: 'quizId e questaoId sao obrigatorios' },
        { status: 400 }
      );
    }

    const db = adminDb();

    // Query simples sem indice composto
    const snapshot = await db
      .collection(COLLECTION)
      .where('quizId', '==', quizId)
      .get();

    // Filtrar e ordenar no codigo
    const anotacoes = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(a => (a as { questaoId?: string }).questaoId === questaoId)
      .sort((a, b) => {
        const dataA = (a as { criadoEm?: string }).criadoEm || '';
        const dataB = (b as { criadoEm?: string }).criadoEm || '';
        return dataB.localeCompare(dataA); // desc
      });

    return NextResponse.json({ anotacoes });
  } catch (error) {
    console.error('Erro ao buscar anotacoes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar anotacoes', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Criar ou atualizar anotacao
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, quizId, questaoId, texto, data } = body;

    if (!quizId || !questaoId || !texto || !data) {
      return NextResponse.json(
        { error: 'quizId, questaoId, texto e data sao obrigatorios' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const now = new Date().toISOString();

    if (id) {
      // Atualizar anotacao existente
      const docRef = db.collection(COLLECTION).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json(
          { error: 'Anotacao nao encontrada' },
          { status: 404 }
        );
      }

      await docRef.update({
        texto,
        atualizadoEm: now,
      });

      return NextResponse.json({
        success: true,
        id,
        message: 'Anotacao atualizada',
      });
    } else {
      // Criar nova anotacao
      const novaAnotacao = {
        quizId,
        questaoId,
        texto,
        data,
        criadoEm: now,
        atualizadoEm: now,
      };

      const docRef = await db.collection(COLLECTION).add(novaAnotacao);

      return NextResponse.json({
        success: true,
        id: docRef.id,
        message: 'Anotacao criada',
      });
    }
  } catch (error) {
    console.error('Erro ao salvar anotacao:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar anotacao', details: String(error) },
      { status: 500 }
    );
  }
}
