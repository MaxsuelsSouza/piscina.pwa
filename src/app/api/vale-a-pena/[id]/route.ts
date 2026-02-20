/**
 * API Route para gerenciar um perfil específico do Vale a Pena Comprar
 * GET /api/vale-a-pena/[id] - Busca um perfil
 * PATCH /api/vale-a-pena/[id] - Atualiza um perfil
 * DELETE /api/vale-a-pena/[id] - Remove um perfil
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'perfisValePena';

// GET - Busca um perfil específico
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
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      perfil: {
        id: doc.id,
        ...doc.data(),
      },
    });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfil', details: String(error) },
      { status: 500 }
    );
  }
}

// PATCH - Atualiza um perfil
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { salarioLiquido } = body;

    const db = adminDb();
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (salarioLiquido !== undefined) {
      if (salarioLiquido <= 0) {
        return NextResponse.json(
          { error: 'Salário líquido deve ser maior que zero' },
          { status: 400 }
        );
      }
      updateData.salarioLiquido = Number(salarioLiquido);
    }

    await docRef.update(updateData);

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar perfil', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove um perfil
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
        { error: 'Perfil não encontrado' },
        { status: 404 }
      );
    }

    await docRef.delete();

    return NextResponse.json({
      success: true,
      message: 'Perfil removido com sucesso',
    });
  } catch (error) {
    console.error('Erro ao remover perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao remover perfil', details: String(error) },
      { status: 500 }
    );
  }
}
