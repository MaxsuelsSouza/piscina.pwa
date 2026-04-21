/**
 * API Route - Aulas de Jiu-Jitsu
 * GET  /api/jiu-jitsu/aulas - Lista todas as aulas
 * POST /api/jiu-jitsu/aulas - Registra uma nova aula
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'jj_aulas';

export async function GET() {
  try {
    const db = adminDb();
    const snapshot = await db.collection(COLLECTION).orderBy('data', 'desc').get();
    const aulas = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ aulas });
  } catch (error) {
    console.error('Erro ao buscar aulas:', error);
    return NextResponse.json({ error: 'Erro ao buscar aulas' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, duracao, instrutor, notas } = body;

    if (!data) {
      return NextResponse.json({ error: 'Data é obrigatória' }, { status: 400 });
    }
    if (!duracao || duracao < 1) {
      return NextResponse.json({ error: 'Duração inválida' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const db = adminDb();
    const docRef = await db.collection(COLLECTION).add({
      data,
      duracao: Number(duracao),
      instrutor: instrutor || '',
      notas: notas || '',
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Erro ao registrar aula:', error);
    return NextResponse.json({ error: 'Erro ao registrar aula' }, { status: 500 });
  }
}
