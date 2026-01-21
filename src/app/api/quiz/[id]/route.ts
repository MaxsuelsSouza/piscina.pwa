/**
 * API Route para operacoes em quiz individual
 * GET /api/quiz/[id] - Busca um quiz especifico
 * PATCH /api/quiz/[id] - Atualiza um quiz
 * DELETE /api/quiz/[id] - Remove um quiz
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'quizzes';

// GET - Busca um quiz especifico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = adminDb();
    const docRef = await db.collection(COLLECTION).doc(id).get();

    if (!docRef.exists) {
      return NextResponse.json(
        { error: 'Quiz nao encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      quiz: {
        id: docRef.id,
        ...docRef.data(),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar quiz:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar quiz', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Atualiza um quiz
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { nome, descricao, status, questoes } = body;

    const db = adminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Quiz nao encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (status !== undefined) updateData.status = status;
    if (questoes !== undefined) {
      updateData.questoes = questoes;
      updateData.totalQuestoes = questoes.length;
    }

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Quiz atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar quiz:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar quiz', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove um quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = adminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Quiz nao encontrado' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Quiz removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover quiz:', error);
    return NextResponse.json(
      { error: 'Erro ao remover quiz', details: String(error) },
      { status: 500 }
    );
  }
}
