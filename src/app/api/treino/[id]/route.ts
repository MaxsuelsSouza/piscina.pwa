/**
 * API Route para gerenciar um treino específico
 * GET /api/treino/[id] - Busca um treino
 * PATCH /api/treino/[id] - Atualiza um treino
 * DELETE /api/treino/[id] - Remove um treino
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'treinos';

// GET - Busca um treino específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = adminDb();
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Treino não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      treino: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar treino:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar treino', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Atualiza um treino
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { nome, descricao, pessoa, status, exercicios, quantidadeDias, dias } = body;

    const db = adminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Treino não encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (nome !== undefined) updateData.nome = nome;
    if (descricao !== undefined) updateData.descricao = descricao;
    if (pessoa !== undefined) updateData.pessoa = pessoa;
    if (status !== undefined) updateData.status = status;
    if (exercicios !== undefined) updateData.exercicios = exercicios;
    if (quantidadeDias !== undefined) updateData.quantidadeDias = quantidadeDias;
    if (dias !== undefined) updateData.dias = dias;

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Treino atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar treino:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar treino', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove um treino
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = adminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Treino não encontrado' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Treino removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover treino:', error);
    return NextResponse.json(
      { error: 'Erro ao remover treino', details: String(error) },
      { status: 500 }
    );
  }
}
