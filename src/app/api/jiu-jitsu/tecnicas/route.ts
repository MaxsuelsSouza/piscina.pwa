/**
 * API Route - Técnicas de Jiu-Jitsu
 * GET  /api/jiu-jitsu/tecnicas - Lista todas as técnicas
 * POST /api/jiu-jitsu/tecnicas - Cria uma nova técnica
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'jj_tecnicas';

export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db.collection(COLLECTION).orderBy('createdAt', 'desc').get();
    const tecnicas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ tecnicas });
  } catch (error) {
    console.error('Erro ao buscar técnicas:', error);
    return NextResponse.json({ error: 'Erro ao buscar técnicas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nome, categoria, nivel, notas, videoUrl } = body;

    if (!nome) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 });
    }
    if (!categoria) {
      return NextResponse.json({ error: 'Categoria é obrigatória' }, { status: 400 });
    }
    if (!nivel) {
      return NextResponse.json({ error: 'Nível é obrigatório' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const db = adminDb();
    const docRef = await db.collection(COLLECTION).add({
      nome,
      categoria,
      nivel,
      notas: notas || '',
      videoUrl: videoUrl || '',
      favorita: false,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar técnica:', error);
    return NextResponse.json({ error: 'Erro ao criar técnica' }, { status: 500 });
  }
}
