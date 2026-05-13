/**
 * API Route para listar presentes
 * GET /api/public/gifts
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { Gift } from '@/types/gift';

// Força renderização dinâmica
export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
  try {
    const { id, maxSelections } = await req.json();

    if (!id || typeof maxSelections !== 'number' || maxSelections < 1) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const db = adminDb();
    await db.collection('gifts').doc(id).update({
      maxSelections,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar', details: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = adminDb();
    const giftsRef = db.collection('gifts');
    const snapshot = await giftsRef.orderBy('category').orderBy('name').get();

    const gifts: Gift[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Gift[];

    return NextResponse.json({ gifts });
  } catch (error) {
    console.error('Erro ao buscar presentes:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar presentes', details: String(error) },
      { status: 500 }
    );
  }
}
