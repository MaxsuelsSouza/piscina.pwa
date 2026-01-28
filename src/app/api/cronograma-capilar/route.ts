/**
 * API Route para gerenciar cronogramas capilares
 * GET /api/cronograma-capilar - Lista todos os cronogramas
 * POST /api/cronograma-capilar - Cria um novo cronograma
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'cronogramas-capilares';

// GET - Lista todos os cronogramas
export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const cronogramas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ cronogramas });
  } catch (error) {
    console.error('Erro ao buscar cronogramas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar cronogramas', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Cria um novo cronograma
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, tratamentosAtivos } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome do cronograma e obrigatorio' },
        { status: 400 }
      );
    }

    if (!tratamentosAtivos || !Array.isArray(tratamentosAtivos) || tratamentosAtivos.length === 0) {
      return NextResponse.json(
        { error: 'Selecione pelo menos um tipo de tratamento' },
        { status: 400 }
      );
    }

    // Hidratacao e sempre obrigatoria
    if (!tratamentosAtivos.includes('hidratacao')) {
      return NextResponse.json(
        { error: 'Hidratacao e obrigatoria no cronograma' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const db = adminDb();

    const cronogramaData = {
      nome,
      tratamentosAtivos,
      historico: [],
      status: 'ativo',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(cronogramaData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Cronograma criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar cronograma:', error);
    return NextResponse.json(
      { error: 'Erro ao criar cronograma', details: String(error) },
      { status: 500 }
    );
  }
}
