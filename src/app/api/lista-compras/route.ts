/**
 * API Route para Lista de Compras
 * GET - Listar todas as listas
 * POST - Criar nova lista
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

// GET - Listar todas as listas de compras
export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db
      .collection('listasCompras')
      .orderBy('createdAt', 'desc')
      .get();

    const listas = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ listas });
  } catch (error) {
    console.error('Erro ao buscar listas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar listas' },
      { status: 500 }
    );
  }
}

// POST - Criar nova lista
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, descricao } = body;

    if (!nome?.trim()) {
      return NextResponse.json(
        { error: 'Nome da lista é obrigatório' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const now = new Date().toISOString();

    const novaLista = {
      nome: nome.trim(),
      descricao: descricao?.trim() || '',
      itens: [],
      status: 'ativa',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection('listasCompras').add(novaLista);

    return NextResponse.json({
      success: true,
      id: docRef.id,
      lista: { id: docRef.id, ...novaLista },
    });
  } catch (error) {
    console.error('Erro ao criar lista:', error);
    return NextResponse.json(
      { error: 'Erro ao criar lista' },
      { status: 500 }
    );
  }
}
