/**
 * API Route para operacoes em cronograma capilar individual
 * GET /api/cronograma-capilar/[id] - Busca um cronograma especifico
 * PATCH /api/cronograma-capilar/[id] - Atualiza (marca tratamento feito)
 * DELETE /api/cronograma-capilar/[id] - Remove um cronograma
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'cronogramas-capilares';

// GET - Busca um cronograma especifico
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
        { error: 'Cronograma nao encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cronograma: {
        id: docRef.id,
        ...docRef.data(),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar cronograma:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cronograma', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Atualiza um cronograma (adicionar tratamento ao historico)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tratamentoRealizado, nome, tratamentosAtivos, status } = body;

    const db = adminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Cronograma nao encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    // Adicionar tratamento ao historico
    if (tratamentoRealizado) {
      const data = doc.data();
      const historico = data?.historico || [];
      historico.push(tratamentoRealizado);
      updateData.historico = historico;
    }

    if (nome !== undefined) updateData.nome = nome;
    if (tratamentosAtivos !== undefined) updateData.tratamentosAtivos = tratamentosAtivos;
    if (status !== undefined) updateData.status = status;

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Cronograma atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar cronograma:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar cronograma', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove um cronograma
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
        { error: 'Cronograma nao encontrado' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Cronograma removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover cronograma:', error);
    return NextResponse.json(
      { error: 'Erro ao remover cronograma', details: String(error) },
      { status: 500 }
    );
  }
}
