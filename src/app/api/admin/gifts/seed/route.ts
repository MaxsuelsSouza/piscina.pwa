/**
 * API Route para popular presentes usando Firebase Admin SDK (server-side)
 * POST /api/admin/gifts/seed
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { GIFTS_SEED_DATA } from '@/data/gifts-seed';

export async function POST() {
  try {
    const db = adminDb();

    // Verifica se já existem presentes
    const giftsRef = db.collection('gifts');
    const existingGifts = await giftsRef.limit(1).get();

    if (!existingGifts.empty) {
      return NextResponse.json(
        { error: 'Presentes já existem na base de dados', code: 'ALREADY_EXISTS' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const batch = db.batch();
    let count = 0;

    // Cria presentes em batch (máximo 500 por batch)
    for (const gift of GIFTS_SEED_DATA) {
      const docRef = giftsRef.doc();
      batch.set(docRef, {
        name: gift.name,
        category: gift.category,
        isSelected: false,
        createdAt: now,
        updatedAt: now,
      });
      count++;
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      message: `${count} presentes criados com sucesso`,
      count,
    });
  } catch (error) {
    console.error('Erro ao popular presentes:', error);
    return NextResponse.json(
      { error: 'Erro ao popular presentes', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = adminDb();
    const giftsRef = db.collection('gifts');
    const snapshot = await giftsRef.count().get();
    const count = snapshot.data().count;

    return NextResponse.json({
      count,
      hasGifts: count > 0,
    });
  } catch (error) {
    console.error('Erro ao verificar presentes:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar presentes', details: String(error) },
      { status: 500 }
    );
  }
}
