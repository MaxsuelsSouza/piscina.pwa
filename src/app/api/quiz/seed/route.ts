/**
 * API Route para seed de quiz
 * POST /api/quiz/seed - Cria quiz com questoes pre-definidas
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { quizProgramacaoQuestoes } from '@/data/quiz-programacao-seed';

export const dynamic = 'force-dynamic';

const COLLECTION = 'quizzes';

// POST - Seed quiz de programacao
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo } = body;

    if (tipo !== 'programacao') {
      return NextResponse.json(
        { error: 'Tipo de quiz invalido. Use: programacao' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const db = adminDb();

    // Verificar se ja existe um quiz de programacao
    const existingSnapshot = await db
      .collection(COLLECTION)
      .where('nome', '==', 'Quiz de Programacao')
      .get();

    if (!existingSnapshot.empty) {
      return NextResponse.json(
        { error: 'Quiz de Programacao ja existe', id: existingSnapshot.docs[0].id },
        { status: 409 }
      );
    }

    const quizData = {
      nome: 'Quiz de Programacao',
      descricao: '200 questoes sobre programacao, Git, JavaScript, arquitetura e mais.',
      status: 'ativo',
      questoes: quizProgramacaoQuestoes,
      totalQuestoes: quizProgramacaoQuestoes.length,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(quizData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: `Quiz criado com ${quizProgramacaoQuestoes.length} questoes`,
    });
  } catch (error) {
    console.error('Erro ao criar quiz seed:', error);
    return NextResponse.json(
      { error: 'Erro ao criar quiz', details: String(error) },
      { status: 500 }
    );
  }
}
