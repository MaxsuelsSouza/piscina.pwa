/**
 * API Route para gerenciar perfis do Vale a Pena Comprar
 * GET /api/vale-a-pena - Lista todos os perfis
 * POST /api/vale-a-pena - Cria um novo perfil
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'perfisValePena';

// GET - Lista todos os perfis
export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const perfis = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ perfis });
  } catch (error) {
    console.error('Erro ao buscar perfis:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar perfis', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Cria um novo perfil
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, salarioLiquido } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    if (!salarioLiquido || salarioLiquido <= 0) {
      return NextResponse.json(
        { error: 'Salário líquido deve ser maior que zero' },
        { status: 400 }
      );
    }

    const db = adminDb();

    // Verificar se já existe perfil com esse nome
    const existing = await db
      .collection(COLLECTION)
      .where('nome', '==', nome)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: `Já existe um perfil para ${nome}` },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const perfilData = {
      nome,
      salarioLiquido: Number(salarioLiquido),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(perfilData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Perfil criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return NextResponse.json(
      { error: 'Erro ao criar perfil', details: String(error) },
      { status: 500 }
    );
  }
}
