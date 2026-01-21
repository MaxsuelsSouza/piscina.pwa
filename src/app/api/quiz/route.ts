/**
 * API Route para gerenciar quizzes
 * GET /api/quiz - Lista todos os quizzes
 * POST /api/quiz - Cria um novo quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'quizzes';

// GET - Lista todos os quizzes
export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const quizzes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('Erro ao buscar quizzes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar quizzes', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Cria um novo quiz
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, descricao, questoes } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome do quiz e obrigatorio' },
        { status: 400 }
      );
    }

    if (!questoes || !Array.isArray(questoes) || questoes.length === 0) {
      return NextResponse.json(
        { error: 'O quiz deve ter pelo menos uma questao' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const db = adminDb();

    const quizData = {
      nome,
      descricao: descricao || '',
      status: 'ativo',
      questoes,
      totalQuestoes: questoes.length,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(quizData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Quiz criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar quiz:', error);
    return NextResponse.json(
      { error: 'Erro ao criar quiz', details: String(error) },
      { status: 500 }
    );
  }
}
