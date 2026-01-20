/**
 * API Route para gerenciar treinos
 * GET /api/treino - Lista todos os treinos
 * POST /api/treino - Cria um novo treino
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'treinos';

// GET - Lista todos os treinos
export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db
      .collection(COLLECTION)
      .orderBy('createdAt', 'desc')
      .get();

    const treinos = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ treinos });
  } catch (error) {
    console.error('Erro ao buscar treinos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar treinos', details: String(error) },
      { status: 500 }
    );
  }
}

// POST - Cria um novo treino
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, descricao, pessoa, exercicios, quantidadeDias, dias } = body;

    if (!nome) {
      return NextResponse.json(
        { error: 'Nome do treino é obrigatório' },
        { status: 400 }
      );
    }

    if (!pessoa) {
      return NextResponse.json(
        { error: 'Pessoa é obrigatória' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const db = adminDb();

    const treinoData = {
      nome,
      descricao: descricao || '',
      pessoa,
      status: 'em_construcao', // Status inicial
      quantidadeDias: quantidadeDias || 3,
      dias: dias || [],
      exercicios: exercicios || [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection(COLLECTION).add(treinoData);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      message: 'Treino criado com sucesso',
    });
  } catch (error) {
    console.error('Erro ao criar treino:', error);
    return NextResponse.json(
      { error: 'Erro ao criar treino', details: String(error) },
      { status: 500 }
    );
  }
}
