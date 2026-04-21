/**
 * API Route - Progresso da faixa
 * GET  /api/jiu-jitsu/progresso - retorna faixa, listras e historico
 * POST /api/jiu-jitsu/progresso - salva progresso e registra evento no historico
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = 'force-dynamic';

const COLLECTION = 'jj_progresso';
const DOC_ID = 'cintura';

export async function GET() {
  try {
    const db = adminDb();
    const doc = await db.collection(COLLECTION).doc(DOC_ID).get();
    if (!doc.exists) {
      return NextResponse.json({ faixa: 'branca', listras: 0, historico: [] });
    }
    const data = doc.data()!;
    return NextResponse.json({
      faixa: data.faixa ?? 'branca',
      listras: data.listras ?? 0,
      historico: data.historico ?? [],
    });
  } catch {
    return NextResponse.json({ faixa: 'branca', listras: 0, historico: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { faixa, listras, evento } = body as {
      faixa: string;
      listras: number;
      evento?: { tipo: 'inicio' | 'listra' | 'faixa'; faixa: string; listras: number; data: string };
    };

    const db = adminDb();
    const ref = db.collection(COLLECTION).doc(DOC_ID);
    const snap = await ref.get();

    const now = new Date().toISOString();

    if (!snap.exists) {
      // Primeira vez — cria o documento com evento de inicio
      const inicioEvento = { tipo: 'inicio', faixa, listras: 0, data: now };
      const historico = [inicioEvento];
      if (evento && evento.tipo !== 'inicio') historico.push(evento);

      await ref.set({ faixa, listras, createdAt: now, updatedAt: now, historico });
    } else {
      // Atualiza e acrescenta evento ao historico
      const existing = snap.data()!;
      const historico: object[] = existing.historico ?? [];
      if (evento) historico.push(evento);

      await ref.update({ faixa, listras, updatedAt: now, historico });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar progresso:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
