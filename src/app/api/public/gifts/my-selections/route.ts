/**
 * API Route para buscar seleções do cliente
 * GET /api/public/gifts/my-selections?phone=11999999999
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import type { GiftSelection } from '@/types/gift';

/**
 * Normaliza telefone (remove caracteres não numéricos)
 */
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get('phone');

    if (!rawPhone) {
      return NextResponse.json(
        { error: 'Parâmetro phone é obrigatório' },
        { status: 400 }
      );
    }

    // Normaliza o telefone para garantir consistência
    const phone = normalizePhone(rawPhone);

    const db = adminDb();
    const selectionsRef = db.collection('giftSelections');
    const snapshot = await selectionsRef
      .where('clientPhone', '==', phone)
      .orderBy('selectedAt', 'desc')
      .get();

    const selections: GiftSelection[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as GiftSelection[];

    return NextResponse.json({ selections });
  } catch (error) {
    console.error('Erro ao buscar seleções:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar seleções', details: String(error) },
      { status: 500 }
    );
  }
}
