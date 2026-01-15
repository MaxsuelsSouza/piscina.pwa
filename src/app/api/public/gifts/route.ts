/**
 * API Route para listar presentes
 * GET /api/public/gifts
 */

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { Gift } from '@/types/gift';

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
